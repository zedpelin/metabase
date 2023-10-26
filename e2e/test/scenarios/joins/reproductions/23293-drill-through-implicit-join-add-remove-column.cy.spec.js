import {
  restore,
  popover,
  visitQuestionAdhoc,
  visitDashboard,
  saveQuestion,
} from "e2e/support/helpers";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import { SAMPLE_DB_ID } from "e2e/support/cypress_data";

const { ORDERS, ORDERS_ID, PRODUCTS } = SAMPLE_DATABASE;

describe("issue 23293", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should retain the filter when drilling through the dashboard card with implicitly added column (metabase#23293)", () => {
    visitQuestionAdhoc({
      dataset_query: {
        database: SAMPLE_DB_ID,
        query: {
          "source-table": ORDERS_ID,
          limit: 50,
        },
        type: "query",
      },
    });

    cy.findByTestId("viz-settings-button").click();
    modifyColumn("Product ID", "remove");
    modifyColumn("Category", "add");
    cy.wait("@dataset");

    saveQuestion(undefined, { wrapId: true });
    cy.get("@questionId").then(id => {
      const questionDetails = {
        query: {
          "source-table": `card__${id}`,
          aggregation: [["count"]],
          breakout: [
            [
              "field",
              PRODUCTS.CATEGORY,
              {
                "source-field": ORDERS.PRODUCT_ID,
              },
            ],
          ],
        },
        display: "bar",
      };

      cy.createQuestionAndDashboard({ questionDetails }).then(
        ({ body: { dashboard_id } }) => {
          visitDashboard(dashboard_id);
        },
      );

      cy.get(".bar").first().realClick();
      popover()
        .findByText(/^See these/)
        .click();

      cy.findByTestId("qb-filters-panel").should(
        "contain",
        "Product → Category is Doohickey",
      );
      cy.findAllByTestId("header-cell")
        .last()
        .should("have.text", "Product → Category");

      cy.findAllByRole("grid")
        .last()
        .as("tableResults")
        .should("contain", "Doohickey")
        .and("not.contain", "Gizmo");
    });
  });
});

/**
 * @param {string} columnName
 * @param {("add"|"remove")} action
 */
function modifyColumn(columnName, action) {
  const icon = action === "add" ? "add" : "eye_outline";
  const iconSelector = `.Icon-${icon}`;
  cy.findAllByRole("listitem", { name: columnName }).find(iconSelector).click();
}
