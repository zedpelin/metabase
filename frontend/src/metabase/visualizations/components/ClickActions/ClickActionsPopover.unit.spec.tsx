import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import {
  getIcon,
  queryIcon,
  renderWithProviders,
  screen,
} from "__support__/ui";
import {
  createOrdersCreatedAtDatasetColumn,
  createOrdersDiscountDatasetColumn,
  createOrdersIdDatasetColumn,
  createOrdersProductIdDatasetColumn,
  createOrdersQuantityDatasetColumn,
  createOrdersTableDatasetColumns,
  createOrdersTotalDatasetColumn,
  createOrdersUserIdDatasetColumn,
  ORDERS,
  ORDERS_ID,
  SAMPLE_DB_ID,
} from "metabase-types/api/mocks/presets";
import { ClickActionsPopover } from "metabase/visualizations/components/ClickActions/ClickActionsPopover";
import type { RegularClickAction } from "metabase/visualizations/types";
import { getMode } from "metabase/visualizations/click-actions/lib/modes";
import { checkNotNull } from "metabase/lib/types";
import type {
  DatasetQuery,
  Filter,
  Series,
  StructuredDatasetQuery,
  RowValue,
  DatasetColumn,
} from "metabase-types/api";
import registerVisualizations from "metabase/visualizations/register";
import { POPOVER_TEST_ID } from "metabase/visualizations/click-actions/actions/ColumnFormattingAction/ColumnFormattingAction";
import {
  createMockColumn,
  createMockSingleSeries,
} from "metabase-types/api/mocks";

import type { ClickObject } from "metabase-lib/queries/drills/types";
import { DEFAULT_QUERY, SAMPLE_METADATA } from "metabase-lib/test-helpers";
import Question from "metabase-lib/Question";
import type StructuredQuery from "metabase-lib/queries/StructuredQuery";
import type Dimension from "metabase-lib/Dimension";

registerVisualizations();

const ORDERS_DATASET_QUERY = DEFAULT_QUERY as StructuredDatasetQuery;
const ORDERS_COLUMNS = createOrdersTableDatasetColumns();
const ORDERS_ROW_VALUES = {
  ID: "3",
  USER_ID: "1",
  PRODUCT_ID: "105",
  SUBTOTAL: 52.723521442619514,
  TAX: 2.9,
  TOTAL: 49.206842233769756,
  DISCOUNT: 6.416679208849759,
  CREATED_AT: "2025-12-06T22:22:48.544+02:00",
  QUANTITY: 2,
};

const AGGREGATED_ORDERS_DATASET_QUERY: StructuredDatasetQuery = {
  type: "query",
  database: SAMPLE_DB_ID,
  query: {
    "source-table": ORDERS_ID,
    aggregation: [
      ["count"],
      [
        "sum",
        [
          "field",
          ORDERS.TAX,
          {
            "base-type": "type/Float",
          },
        ],
      ],
      [
        "max",
        [
          "field",
          ORDERS.DISCOUNT,
          {
            "base-type": "type/Float",
          },
        ],
      ],
    ],
    breakout: [
      [
        "field",
        ORDERS.PRODUCT_ID,
        {
          "base-type": "type/Integer",
        },
      ],
      [
        "field",
        ORDERS.CREATED_AT,
        {
          "base-type": "type/DateTime",
          "temporal-unit": "month",
        },
      ],
    ],
  },
};
const AGGREGATED_ORDERS_QUESTION = Question.create({
  metadata: SAMPLE_METADATA,
  dataset_query: AGGREGATED_ORDERS_DATASET_QUERY,
});
const AGGREGATED_ORDERS_COLUMNS_MAP = {
  PRODUCT_ID: createOrdersProductIdDatasetColumn({
    source: "breakout",
    field_ref: [
      "field",
      ORDERS.PRODUCT_ID,
      {
        "base-type": "type/Integer",
      },
    ],
  }),
  CREATED_AT: createOrdersCreatedAtDatasetColumn({
    source: "breakout",
    field_ref: [
      "field",
      ORDERS.CREATED_AT,
      {
        "base-type": "type/DateTime",
        "temporal-unit": "month",
      },
    ],
    unit: "month",
  }),

  count: createMockColumn({
    base_type: "type/BigInteger",
    name: "count",
    display_name: "Count",
    semantic_type: "type/Quantity",
    source: "aggregation",
    field_ref: ["aggregation", 0],
    effective_type: "type/BigInteger",
  }),

  sum: createMockColumn({
    base_type: "type/Float",
    name: "sum",
    display_name: "Sum of Tax",
    source: "aggregation",
    field_ref: ["aggregation", 1],
    effective_type: "type/Float",
  }),

  max: createMockColumn({
    base_type: "type/Float",
    name: "max",
    display_name: "Max of Discount",
    source: "aggregation",
    field_ref: ["aggregation", 2],
    effective_type: "type/Float",
  }),
};
const AGGREGATED_ORDERS_COLUMNS = Object.values(AGGREGATED_ORDERS_COLUMNS_MAP);
const AGGREGATED_ORDERS_ROW_VALUES: Record<
  keyof typeof AGGREGATED_ORDERS_COLUMNS_MAP,
  RowValue
> = {
  PRODUCT_ID: 3,
  CREATED_AT: "2022-12-01T00:00:00+02:00",
  count: 77,
  sum: 1,
  max: null,
};

describe("ClickActionsPopover", function () {
  describe("apply click actions", () => {
    describe("ColumnFormattingAction", () => {
      it("should apply column formatting to default ORDERS question on header click", async () => {
        const { props } = await setup();

        const gearIconButton = getIcon("gear");
        expect(gearIconButton).toBeInTheDocument();

        userEvent.click(gearIconButton);

        expect(screen.getByTestId(POPOVER_TEST_ID)).toBeInTheDocument();

        userEvent.type(screen.getByLabelText("Column title"), " NEW NAME");
        userEvent.tab(); // blur field

        expect(props.onUpdateVisualizationSettings).toHaveBeenCalledTimes(1);
        expect(props.onUpdateVisualizationSettings).toHaveBeenLastCalledWith({
          column_settings: {
            [`["ref",["field",${ORDERS.ID},{\"base-type\":\"type/Integer\"}]]`]:
              {
                column_title: "ID NEW NAME",
              },
          },
        });
      });
    });

    describe("ColumnFilterDrill", () => {
      it("should apply ColumnFilterDrill to default ORDERS question on header click", async () => {
        const filterValue = 10;
        const { props } = await setup();

        const filterDrill = screen.getByText("Filter by this column");
        expect(filterDrill).toBeInTheDocument();

        userEvent.click(filterDrill);

        const filterField = screen.getByPlaceholderText("Enter an ID");
        expect(filterField).toBeInTheDocument();

        userEvent.type(filterField, filterValue.toString());
        userEvent.click(screen.getByText("Add filter"));

        expect(props.onChangeCardAndRun).toHaveBeenCalledTimes(1);
        expect(props.onChangeCardAndRun).toHaveBeenLastCalledWith({
          nextCard: expect.objectContaining({
            dataset_query: {
              database: SAMPLE_DB_ID,
              query: {
                filter: [
                  "=",
                  ["field", ORDERS.ID, { "base-type": "type/Integer" }],
                  filterValue,
                ],
                "source-table": ORDERS_ID,
              },
              type: "query",
            },
            display: "table",
          }),
        });
      });
    });

    describe("SortDrill", () => {
      it("should display proper sorting controls", async () => {
        await setup();

        const sortDesc = getIcon("arrow_down");
        expect(sortDesc).toBeInTheDocument();

        userEvent.hover(sortDesc);
        expect(screen.getByText("Sort descending")).toBeInTheDocument();

        const sortAsc = getIcon("arrow_up");
        expect(sortAsc).toBeInTheDocument();

        userEvent.hover(sortAsc);
        expect(screen.getByText("Sort ascending")).toBeInTheDocument();
      });

      it("should display specific sorting control when only one sorting direction is available", async () => {
        await setup({
          question: Question.create({
            metadata: SAMPLE_METADATA,
            dataset_query: {
              ...ORDERS_DATASET_QUERY,
              query: {
                ...ORDERS_DATASET_QUERY.query,
                "order-by": [["asc", ["field", ORDERS.ID, null]]],
              },
            },
          }),
        });

        expect(queryIcon("arrow_up")).not.toBeInTheDocument();

        const sortDesc = getIcon("arrow_down");
        expect(sortDesc).toBeInTheDocument();
      });

      it("should apply SortDrill to default ORDERS question on ID column header click", async () => {
        const { props } = await setup();

        const sortDesc = getIcon("arrow_down");
        userEvent.click(sortDesc);

        expect(props.onChangeCardAndRun).toHaveBeenCalledTimes(1);
        expect(props.onChangeCardAndRun).toHaveBeenLastCalledWith({
          nextCard: expect.objectContaining({
            dataset_query: {
              ...ORDERS_DATASET_QUERY,
              query: {
                ...ORDERS_DATASET_QUERY.query,
                "order-by": [
                  [
                    "desc",
                    [
                      "field",
                      ORDERS.ID,
                      {
                        "base-type": "type/BigInteger",
                      },
                    ],
                  ],
                ],
              },
            },
            display: "table",
          }),
        });
      });
    });

    describe("SummarizeColumnByTimeDrill", () => {
      it.each([
        {
          column: createOrdersTotalDatasetColumn(),
          columnName: createOrdersTotalDatasetColumn().name,
          expectedCard: {
            dataset_query: getSummarizedOverTimeResultDatasetQuery(
              ORDERS.TOTAL,
              "type/Float",
            ),
            display: "table",
          },
        },
        {
          column: createOrdersQuantityDatasetColumn(),
          columnName: createOrdersQuantityDatasetColumn().name,
          expectedCard: {
            dataset_query: getSummarizedOverTimeResultDatasetQuery(
              ORDERS.QUANTITY,
              "type/Integer",
            ),
            display: "table",
          },
        },
      ])(
        "should apply drill to default ORDERS question on $columnName header click",
        async ({ column, expectedCard }) => {
          const { props } = await setup({
            clicked: {
              column,
              value: undefined,
            },
          });

          const drill = screen.getByText("Sum over time");
          expect(drill).toBeInTheDocument();

          userEvent.click(drill);

          expect(props.onChangeCardAndRun).toHaveBeenCalledTimes(1);
          expect(props.onChangeCardAndRun).toHaveBeenLastCalledWith({
            nextCard: expect.objectContaining(expectedCard),
          });
        },
      );
    });

    describe("FKFilterDrill", () => {
      it.each([
        {
          column: createOrdersUserIdDatasetColumn(),
          columnName: createOrdersUserIdDatasetColumn().name,
          cellValue: "1",
          drillTitle: "View this User's Orders",
          expectedCard: {
            dataset_query: getFKFilteredResultDatasetQuery(
              ORDERS.USER_ID,
              "type/Integer",
              "1",
            ),
            display: "table",
          },
        },
        {
          column: createOrdersProductIdDatasetColumn(),
          columnName: createOrdersProductIdDatasetColumn().name,
          cellValue: "111",
          drillTitle: "View this Product's Orders",
          expectedCard: {
            dataset_query: getFKFilteredResultDatasetQuery(
              ORDERS.PRODUCT_ID,
              "type/Integer",
              "111",
            ),
            display: "table",
          },
        },
      ])(
        "should apply drill on $columnName cell click",
        async ({ column, cellValue, drillTitle, expectedCard }) => {
          const { props } = await setup({
            clicked: {
              column,
              value: cellValue,
            },
          });

          const drill = screen.getByText(drillTitle);
          expect(drill).toBeInTheDocument();

          userEvent.click(drill);

          expect(props.onChangeCardAndRun).toHaveBeenCalledTimes(1);
          expect(props.onChangeCardAndRun).toHaveBeenLastCalledWith({
            nextCard: expect.objectContaining(expectedCard),
          });
        },
      );
    });

    describe("QuickFilterDrill", () => {
      it.each([
        {
          column: createOrdersTotalDatasetColumn(),
          columnName: createOrdersTotalDatasetColumn().name,
          cellValue: ORDERS_ROW_VALUES.TOTAL,
          drillTitle: ">",
          expectedCard: {
            dataset_query: getQuickFilterResultDatasetQuery({
              filteredColumnId: ORDERS.TOTAL,
              filterOperator: ">",
              filterColumnType: "type/Float",
              cellValue: ORDERS_ROW_VALUES.TOTAL,
            }),
            display: "table",
          },
        },

        {
          column: createOrdersCreatedAtDatasetColumn(),
          columnName: createOrdersCreatedAtDatasetColumn().name,
          cellValue: ORDERS_ROW_VALUES.CREATED_AT,
          drillTitle: "Before",
          expectedCard: {
            dataset_query: getQuickFilterResultDatasetQuery({
              filteredColumnId: ORDERS.CREATED_AT,
              filterOperator: "<",
              filterColumnType: "type/DateTime",
              cellValue: ORDERS_ROW_VALUES.CREATED_AT,
            }),
            display: "table",
          },
        },

        {
          column: createOrdersDiscountDatasetColumn(),
          columnName: createOrdersDiscountDatasetColumn().name,
          cellValue: null,
          drillTitle: "=",
          expectedCard: {
            dataset_query: getQuickFilterResultDatasetQuery({
              filteredColumnId: ORDERS.DISCOUNT,
              filterOperator: "is-null",
              filterColumnType: "type/Float",
              cellValue: null,
            }),
            display: "table",
          },
        },
      ])(
        "should apply drill on $columnName cell click",
        async ({ column, cellValue, drillTitle, expectedCard }) => {
          const { props } = await setup({
            clicked: {
              column,
              value: cellValue,
            },
          });

          const drill = screen.getByText(drillTitle);
          expect(drill).toBeInTheDocument();

          userEvent.click(drill);

          expect(props.onChangeCardAndRun).toHaveBeenCalledTimes(1);
          expect(props.onChangeCardAndRun).toHaveBeenLastCalledWith(
            expect.objectContaining({
              nextCard: expect.objectContaining(expectedCard),
            }),
          );
        },
      );
    });

    describe("ZoomTimeseriesDrill", () => {
      it.each([
        {
          column: AGGREGATED_ORDERS_COLUMNS_MAP.CREATED_AT,
          columnName: AGGREGATED_ORDERS_COLUMNS_MAP.CREATED_AT.name,
          cellValue: AGGREGATED_ORDERS_ROW_VALUES.CREATED_AT,
          drillTitle: "See this month by week",
          expectedCard: {
            dataset_query: {
              ...AGGREGATED_ORDERS_DATASET_QUERY,
              query: {
                ...AGGREGATED_ORDERS_DATASET_QUERY.query,
                breakout: [
                  [
                    "field",
                    ORDERS.PRODUCT_ID,
                    {
                      "base-type": "type/Integer",
                    },
                  ],
                  [
                    "field",
                    ORDERS.CREATED_AT,
                    {
                      "base-type": "type/DateTime",
                      "temporal-unit": "week",
                    },
                  ],
                ],
              },
            },
            display: "table",
          },
        },
        {
          column: AGGREGATED_ORDERS_COLUMNS_MAP.count,
          columnName: AGGREGATED_ORDERS_COLUMNS_MAP.count.name,
          cellValue: AGGREGATED_ORDERS_ROW_VALUES.count,
          drillTitle: "See this month by week",
          expectedCard: {
            dataset_query: {
              ...AGGREGATED_ORDERS_DATASET_QUERY,
              query: {
                ...AGGREGATED_ORDERS_DATASET_QUERY.query,
                filter: [
                  "=",
                  [
                    "field",
                    AGGREGATED_ORDERS_COLUMNS_MAP.CREATED_AT.id,
                    { "base-type": "type/DateTime", "temporal-unit": "month" },
                  ],
                  AGGREGATED_ORDERS_ROW_VALUES.CREATED_AT,
                ],
                breakout: [
                  [
                    "field",
                    ORDERS.PRODUCT_ID,
                    {
                      "base-type": "type/Integer",
                    },
                  ],
                  [
                    "field",
                    ORDERS.CREATED_AT,
                    {
                      "base-type": "type/DateTime",
                      "temporal-unit": "week",
                    },
                  ],
                ],
              },
            },
            display: "table",
          },
        },
      ])(
        "should apply drill on $columnName cell click",
        async ({ column, cellValue, drillTitle, expectedCard }) => {
          const { props } = await setup({
            question: AGGREGATED_ORDERS_QUESTION,
            clicked: {
              column,
              value: cellValue,
            },
            columns: AGGREGATED_ORDERS_COLUMNS,
            rowValues: AGGREGATED_ORDERS_ROW_VALUES,
          });

          const drill = screen.getByText(drillTitle);
          expect(drill).toBeInTheDocument();

          userEvent.click(drill);

          expect(props.onChangeCardAndRun).toHaveBeenCalledTimes(1);
          expect(props.onChangeCardAndRun).toHaveBeenLastCalledWith(
            expect.objectContaining({
              nextCard: expect.objectContaining(expectedCard),
            }),
          );
        },
      );
    });
  });
});

async function setup({
  question = Question.create({
    metadata: SAMPLE_METADATA,
    dataset_query: ORDERS_DATASET_QUERY,
  }),
  clicked = {
    column: createOrdersIdDatasetColumn(),
    value: undefined,
  },
  settings = {},
  dimension: inputDimension,
  columns = ORDERS_COLUMNS,
  rowValues = ORDERS_ROW_VALUES,
}: Partial<{
  question: Question;
  clicked: ClickObject | undefined;
  settings: Record<string, any>;
  dimension?: Dimension;
  columns?: DatasetColumn[];
  rowValues?: Record<string, RowValue>;
}> = {}) {
  const mode = checkNotNull(getMode(question));

  const dimension =
    inputDimension ||
    (question?.query() as StructuredQuery).dimensionForColumn(
      checkNotNull(clicked?.column),
    );

  const clickedData = columns?.map(column => ({
    col: column,
    value: rowValues[column.name],
  }));

  const hasAggregations = (
    question?.query() as StructuredQuery
  ).canRemoveAggregation();
  const dimensions = hasAggregations
    ? clickedData
        .filter(
          ({ col }) =>
            col?.source === "breakout" && col?.name !== clicked?.column?.name,
        )
        .map(({ value, col }) => ({ value, column: col }))
    : undefined;

  clicked = {
    ...clicked,
    dimension: dimension || undefined,
    data: clickedData,
    dimensions,
  };

  const clickActions = mode.actionsForClick(
    clicked,
    settings,
  ) as RegularClickAction[];

  const dispatch = jest.fn();
  const onChangeCardAndRun = jest.fn();
  const onClose = jest.fn();
  const onUpdateVisualizationSettings = jest.fn();

  // used only in FormatDrill. To be refactored. I think we should pass this widget from the outside, ready to be rendered
  const series: Series = [
    createMockSingleSeries(
      {
        dataset_query: question.datasetQuery(),
      },
      {
        data: {
          cols: [...columns],
          rows: [],
          requested_timezone: "UTC",
          results_timezone: "Asia/Nicosia",
          results_metadata: {
            columns: [...columns],
          },
        },
      },
    ),
  ];

  const view = renderWithProviders(
    <ClickActionsPopover
      clickActions={clickActions}
      clicked={clicked}
      series={series}
      dispatch={dispatch}
      onChangeCardAndRun={onChangeCardAndRun}
      onUpdateVisualizationSettings={onUpdateVisualizationSettings}
      onClose={onClose}
    />,
  );

  const updatedClicked = {
    ...clicked,
    element: view.baseElement,
  };

  view.rerender(
    <ClickActionsPopover
      clickActions={clickActions}
      clicked={updatedClicked}
      series={series as unknown as Series}
      dispatch={dispatch}
      onChangeCardAndRun={onChangeCardAndRun}
      onUpdateVisualizationSettings={onUpdateVisualizationSettings}
      onClose={onClose}
    />,
  );

  await waitFor(async () => {
    expect(
      (await screen.findAllByTestId("drill-through-section")).length,
    ).toBeGreaterThan(0);
  });

  return {
    props: {
      clickActions,
      clicked: updatedClicked,
      series,
      dispatch,
      onChangeCardAndRun,
      onUpdateVisualizationSettings,
      onClose,
    },
    view,
  };
}

function getSummarizedOverTimeResultDatasetQuery(
  aggregatedColumnId: number,
  aggregatedColumnType: string,
): DatasetQuery {
  return {
    database: SAMPLE_DB_ID,
    query: {
      aggregation: [
        [
          "sum",
          [
            "field",
            aggregatedColumnId,
            {
              "base-type": aggregatedColumnType,
            },
          ],
        ],
      ],
      breakout: [
        [
          "field",
          ORDERS.CREATED_AT,
          {
            "base-type": "type/DateTime",
            "temporal-unit": "month",
          },
        ],
      ],
      "source-table": ORDERS_ID,
    },
    type: "query",
  };
}

function getFKFilteredResultDatasetQuery(
  filteredColumnId: number,
  filteredColumnType: string,
  cellValue: string,
): DatasetQuery {
  return {
    database: SAMPLE_DB_ID,
    query: {
      filter: [
        "=",
        [
          "field",
          filteredColumnId,
          {
            "base-type": filteredColumnType,
          },
        ],
        cellValue,
      ],
      "source-table": ORDERS_ID,
    },
    type: "query",
  };
}

function getQuickFilterResultDatasetQuery({
  filteredColumnId,
  filterOperator,
  filterColumnType,
  cellValue,
}: {
  filteredColumnId: number;
  filterOperator: "=" | "!=" | ">" | "<" | "is-null" | "not-null";
  filterColumnType: string;
  cellValue: string | number | null | undefined;
}): DatasetQuery {
  const filterClause = ["is-null", "not-null"].includes(filterOperator)
    ? ([
        filterOperator,
        ["field", filteredColumnId, { "base-type": filterColumnType }],
      ] as Filter)
    : ([
        filterOperator,
        ["field", filteredColumnId, { "base-type": filterColumnType }],
        cellValue,
      ] as Filter);

  return {
    database: SAMPLE_DB_ID,
    query: {
      filter: filterClause,
      "source-table": ORDERS_ID,
    },
    type: "query",
  };
}
