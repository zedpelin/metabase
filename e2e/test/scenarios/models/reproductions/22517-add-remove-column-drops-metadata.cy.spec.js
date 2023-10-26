import { restore, openQuestionActions, popover } from "e2e/support/helpers";

const renamedColumn = "Foo";

describe("issue 22517", () => {
  beforeEach(() => {
    cy.intercept("POST", "/api/card/*/query").as("cardQuery");
    cy.intercept("PUT", "/api/card/*").as("updateMetadata");

    restore();
    cy.signInAsAdmin();

    cy.createNativeQuestion(
      {
        name: "22517",
        native: { query: `select * from orders limit 5` },
        dataset: true,
      },
      { visitQuestion: true },
    );

    openQuestionActions();
    popover().findByText("Edit metadata").should("be.visible").click();

    renameColumn("ID", renamedColumn);

    cy.findByTestId("dataset-edit-bar").button("Save changes").click();
    cy.wait("@updateMetadata");
  });

  it("adding or removing a column should not drop previously edited metadata (metabase#22517)", () => {
    openQuestionActions();
    popover().findByText("Edit query definition").should("be.visible").click();

    cy.log("Make sure previous metadata changes are reflected in the UI.");
    cy.findAllByTestId("header-cell")
      .first()
      .should("have.text", renamedColumn);

    // This will edit the original query and add the `SIZE` column
    // Updated query: `select *, case when quantity > 4 then 'large' else 'small' end size from orders`
    cy.get(".ace_content").type(
      "{leftarrow}".repeat(" from orders limit 5".length) +
        ", case when quantity > 4 then 'large' else 'small' end size ",
    );

    cy.findByTestId("native-query-editor-container").icon("play").click();
    cy.wait("@dataset");

    cy.findAllByTestId("header-cell")
      .first()
      .should("have.text", renamedColumn);

    cy.findByTestId("dataset-edit-bar").button("Save changes").click();

    cy.findAllByTestId("header-cell")
      .first()
      .should("have.text", renamedColumn);
  });
});

function renameColumn(column, newName) {
  cy.findByDisplayValue(column).clear().type(newName).realPress("Tab");
}
