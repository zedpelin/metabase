import { WRITABLE_DB_ID } from "e2e/support/cypress_data";
import {
  editDashboard,
  resetTestTable,
  restore,
  resyncDatabase,
  showDashboardCardActions,
  sidebar,
  visitDashboard,
  setupWritableDB,
  addMySQLDatabase,
} from "e2e/support/helpers";

describe("issue 18067", { tags: "@external" }, () => {
  const TEST_TABLE = "many_data_types";

  before(() => {
    restore("default");
    cy.signInAsAdmin();

    setupWritableDB("mysql");
    addMySQLDatabase("Writable MySQL8", true);
  });

  beforeEach(() => {
    cy.signInAsAdmin();
    resetTestTable({ type: "mysql", table: TEST_TABLE });

    resyncDatabase({
      dbId: WRITABLE_DB_ID,
      tableName: TEST_TABLE,
      tableAlias: "testTable",
    });
  });

  it("should allow settings click behavior on boolean fields (metabase#18067)", () => {
    cy.get("@testTable").then(testTable => {
      const dashboardDetails = {
        name: "18067 dashboard",
      };
      const questionDetails = {
        name: "18067 question",
        database: WRITABLE_DB_ID,
        query: { "source-table": testTable.id },
      };
      cy.createQuestionAndDashboard({
        dashboardDetails,
        questionDetails,
      }).then(({ body: { dashboard_id } }) => {
        visitDashboard(dashboard_id);
      });
    });

    editDashboard();

    cy.log('Select "click behavior" option');
    showDashboardCardActions();
    cy.findByTestId("dashboardcard-actions-panel").icon("click").click();

    sidebar().within(() => {
      cy.findByText("Boolean").scrollIntoView().click();
      cy.contains("Click behavior for Boolean").should("be.visible");
    });
  });
});
