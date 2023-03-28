import React from "react";
import { fireEvent, render, screen } from "__support__/ui";

import * as Lib from "metabase-lib";
import { getSavedStructuredQuestion } from "metabase-lib/mocks";
import type StructuredQuery from "metabase-lib/queries/StructuredQuery";

import { NotebookStep as INotebookStep } from "../../lib/steps.types";
import LimitStep from "./LimitStep";

const DEFAULT_QUESTION = getSavedStructuredQuestion();
const DEFAULT_LEGACY_QUERY = DEFAULT_QUESTION.query() as StructuredQuery;
const DEFAULT_QUERY = DEFAULT_QUESTION._getMLv2Query();

const DEFAULT_LIMIT = 10;
const QUERY_WITH_LIMIT = Lib.limit(DEFAULT_QUERY, DEFAULT_LIMIT);

function createNotebookStep(opts = {}): INotebookStep {
  return {
    id: "test-step",
    type: "limit",
    stageIndex: 0,
    itemIndex: 0,
    query: DEFAULT_LEGACY_QUERY,
    topLevelQuery: DEFAULT_QUERY,
    valid: true,
    active: true,
    visible: true,
    actions: [],
    previewQuery: null,
    next: null,
    previous: null,
    revert: jest.fn(),
    clean: jest.fn(),
    update: jest.fn(),
    ...opts,
  };
}

function setup(step = createNotebookStep()) {
  const updateQuery = jest.fn();

  render(<LimitStep step={step} color="brand" updateQuery={updateQuery} />);

  function getNextQuery() {
    const [lastCall] = updateQuery.mock.calls.slice(-1);
    return lastCall[0];
  }

  return { getNextQuery, updateQuery };
}

describe("LimitStep", () => {
  it("should render correctly without a limit", () => {
    setup();
    expect(screen.getByPlaceholderText("Enter a limit")).toBeInTheDocument();
  });

  it("should render correctly with limit set", () => {
    const step = createNotebookStep({ topLevelQuery: QUERY_WITH_LIMIT });
    setup(step);

    expect(screen.getByDisplayValue(String(DEFAULT_LIMIT))).toBeInTheDocument();
  });

  it("should set the limit", () => {
    const { getNextQuery } = setup();
    const limitInput = screen.getByPlaceholderText("Enter a limit");

    fireEvent.change(limitInput, { target: { value: "52" } });

    expect(Lib.currentLimit(getNextQuery())).toBe(52);
  });

  it("should update the limit", () => {
    const step = createNotebookStep({ topLevelQuery: QUERY_WITH_LIMIT });
    const { getNextQuery } = setup(step);
    const limitInput = screen.getByPlaceholderText("Enter a limit");

    fireEvent.change(limitInput, { target: { value: "1000" } });

    expect(Lib.currentLimit(getNextQuery())).toBe(1000);
  });

  it("shouldn't update the limit if zero provided", () => {
    const step = createNotebookStep({ topLevelQuery: QUERY_WITH_LIMIT });
    const { updateQuery } = setup(step);
    const limitInput = screen.getByPlaceholderText("Enter a limit");

    fireEvent.change(limitInput, { target: { value: "0" } });

    expect(updateQuery).not.toHaveBeenCalled();
  });

  it("shouldn't update the limit if its negative", () => {
    const step = createNotebookStep({ topLevelQuery: QUERY_WITH_LIMIT });
    const { updateQuery } = setup(step);
    const limitInput = screen.getByPlaceholderText("Enter a limit");

    fireEvent.change(limitInput, { target: { value: "-1" } });

    expect(updateQuery).not.toHaveBeenCalled();
  });
});
