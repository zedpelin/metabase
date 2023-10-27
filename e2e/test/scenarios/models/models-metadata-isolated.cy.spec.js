import {
  modal,
  restore,
  visualize,
  popover,
  openQuestionActions,
  openColumnOptions,
  renameColumn,
  setColumnType,
  saveMetadataChanges,
} from "e2e/support/helpers";

import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";
import { startQuestionFromModel } from "./helpers/e2e-models-helpers";

const { ORDERS_ID } = SAMPLE_DATABASE;

describe("scenarios > models metadata", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
    cy.intercept("POST", "/api/card/*/query").as("cardQuery");
    cy.intercept("POST", "/api/dataset").as("dataset");
  });

  describe("GUI model", () => {
    beforeEach(() => {
      const modelDetails = {
        name: "GUI Model",
        query: {
          "source-table": ORDERS_ID,
          limit: 5,
        },
        dataset: true,
      };

      cy.createQuestion(modelDetails).then(({ body: { id } }) => {
        cy.visit(`/model/${id}`);
        cy.wait("@dataset");
      });
    });

    it("should edit GUI model metadata", () => {
      openQuestionActions();

      popover().findByTextEnsureVisible("89%").realHover();

      cy.findByTestId("tooltip-content").within(() => {
        cy.findByText(
          "Some columns are missing a column type, description, or friendly name.",
        );
        cy.findByText(
          "Adding metadata makes it easier for your team to explore this data.",
        );
      });

      popover().findByTextEnsureVisible("Edit metadata").click();
      cy.url().should("include", "/metadata");

      openColumnOptions("Subtotal");
      renameColumn("Subtotal", "Pre-tax");
      setColumnType("No special type", "Cost");
      saveMetadataChanges();

      cy.log(
        "Ensure that a question created from this model inherits its metadata.",
      );
      startQuestionFromModel("GUI Model");
      visualize();

      cy.findAllByTestId("header-cell")
        .should("contain", "Pre-tax ($)")
        .and("not.contain", "Subtotal");
    });

    it("allows for canceling changes", () => {
      openQuestionActions();
      popover().findByTextEnsureVisible("Edit metadata").click();

      openColumnOptions("Subtotal");
      renameColumn("Subtotal", "Pre-tax");
      setColumnType("No special type", "Cost");

      cy.findByTestId("dataset-edit-bar").button("Cancel").click();
      modal().button("Discard changes").click();

      cy.findAllByTestId("header-cell")
        .should("contain", "Subtotal")
        .and("not.contain", "Pre-tax");
    });

    it("clears custom metadata when a model is turned back into a question", () => {
      openQuestionActions();
      popover().findByTextEnsureVisible("Edit metadata").click();

      openColumnOptions("Subtotal");
      renameColumn("Subtotal", "Pre-tax");
      setColumnType("No special type", "Cost");
      saveMetadataChanges();

      cy.findAllByTestId("header-cell")
        .should("contain", "Pre-tax ($)")
        .and("not.contain", "Subtotal");

      openQuestionActions();
      popover().findByTextEnsureVisible("Turn back to saved question").click();
      cy.wait("@cardQuery");

      cy.findAllByTestId("header-cell")
        .should("contain", "Subtotal")
        .and("not.contain", "Pre-tax ($)");
    });
  });
});
