import type { EChartsOption } from "echarts";
import type { CartesianChartModel } from "metabase/visualizations/echarts/cartesian/model/types";
import { buildEChartsSeries } from "metabase/visualizations/echarts/cartesian/option/series";
import type {
  ComputedVisualizationSettings,
  RenderingContext,
} from "metabase/visualizations/types";
import { buildAxes } from "metabase/visualizations/echarts/cartesian/option/axis";
import { getGoalLineEChartsSeries } from "./goal-line";

export const getCartesianChartOption = (
  chartModel: CartesianChartModel,
  settings: ComputedVisualizationSettings,
  renderingContext: RenderingContext,
): EChartsOption => {
  const goalLineSeries = getGoalLineEChartsSeries(settings, renderingContext);
  const dataSeries = buildEChartsSeries(chartModel, settings, renderingContext);

  const dimensions = [
    chartModel.dimensionModel.dataKey,
    ...chartModel.seriesModels.map(seriesModel => seriesModel.dataKey),
  ];
  const echartsDataset = [
    { source: chartModel.dataset, dimensions },
    { source: chartModel.normalizedDataset, dimensions },
  ];

  return {
    dataset: echartsDataset,
    series: goalLineSeries ? [goalLineSeries, ...dataSeries] : dataSeries,
    ...buildAxes(chartModel, settings, renderingContext),
  } as EChartsOption;
};
