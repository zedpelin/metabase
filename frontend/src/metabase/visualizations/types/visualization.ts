import type {
  Card,
  DatasetData,
  RawSeries,
  Series,
  TransformedSeries,
  VisualizationSettingId,
  VisualizationSettings,
} from "metabase-types/api";
import type { ClickObject } from "metabase/visualizations/types";
import type { IconName, IconProps } from "metabase/core/components/Icon";
import type Query from "metabase-lib/queries/Query";

import type Question from "metabase-lib/Question";
import type { HoveredObject } from "./hover";
import type { RemappingHydratedDatasetColumn } from "./columns";

type OnChangeCardAndRunOpts = {
  previousCard?: Card;
  nextCard: Card;
  seriesIndex?: number;
};

export type OnChangeCardAndRun = (opts: OnChangeCardAndRunOpts) => void;

export type ComputedVisualizationSettings = VisualizationSettings & {
  column?: (
    col: RemappingHydratedDatasetColumn,
  ) => RemappingHydratedDatasetColumn;
};

export interface VisualizationProps {
  series: Series;
  card: Card;
  data: DatasetData;
  rawSeries: RawSeries;
  settings: ComputedVisualizationSettings;
  headerIcon: IconProps;
  actionButtons: React.ReactNode;
  fontFamily: string;
  isPlaceholder?: boolean;
  isFullscreen: boolean;
  isQueryBuilder: boolean;
  showTitle: boolean;
  isDashboard: boolean;
  isEditing: boolean;
  isSettings: boolean;
  hovered?: HoveredObject;
  className?: string;

  gridSize?: VisualizationGridSize;
  width: number;
  height: number;

  visualizationIsClickable: (clickObject?: ClickObject) => boolean;
  getExtraDataForClick?: (clickObject?: ClickObject) => Record<string, unknown>;

  onRender: ({
    yAxisSplit,
    warnings,
  }: {
    yAxisSplit?: number[][];
    warnings?: string[];
  }) => void;
  onRenderError: (error?: Error) => void;
  onChangeCardAndRun: OnChangeCardAndRun;
  onHoverChange: (hoverObject?: HoveredObject | null) => void;
  onVisualizationClick: (clickObject?: ClickObject) => void;
  onUpdateVisualizationSettings: (settings: VisualizationSettings) => void;

  "graph.dimensions"?: string[];
  "graph.metrics"?: string[];

  onAddSeries?: any;
  onEditSeries?: any;
  onRemoveSeries?: any;
  onUpdateWarnings?: any;
}

export type WidgetName =
  | "input"
  | "inputGroup"
  | "number"
  | "radio"
  | "select"
  | "toggle"
  | "segmentedControl"
  | "field"
  | "fields"
  | "fieldsPartition"
  | "color"
  | "colors";

export type VisualizationSettingDefinition<TObject, TValue, TProps = void> = {
  widget?: WidgetName | React.ComponentType<TProps>;
  inline?: boolean;
  useRawSeries?: boolean;
  group?: string;

  // is the setting visible in the dashboard card viz settings
  dashboard?: boolean;

  readDependencies?: VisualizationSettingId[];
  writeDependencies?: VisualizationSettingId[];
  eraseDependencies?: VisualizationSettingId[];

  default?: TValue;
  getDefault?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => TValue;
  persistDefault?: boolean;

  getValue?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => TValue;
  isValid?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => boolean;

  section?: string;
  getSection?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => string;

  title?: string;
  getTitle?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => string;

  hidden?: boolean;
  getHidden?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => boolean;

  marginBottom?: string;
  getMarginBottom?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => string;

  disabled?: boolean;
  getDisabled?: (
    object: TObject,
    settings: VisualizationSettings,
    extra: unknown,
  ) => boolean;

  props?: TProps;
  getProps?: (
    object: TObject,
    settings: VisualizationSettings,
    onChange: (value: TValue) => void,
    extra: unknown,
  ) => TProps;
  onUpdate?: (value: TValue, extra: unknown) => void;
};

export type VisualizationSettingsDefinitions<TObject = unknown> = {
  [id in VisualizationSettingId]: VisualizationSettingDefinition<
    TObject,
    VisualizationSettings[id],
    unknown
  >;
};

// returned by getSettingWidget
export type VisualizationSettingWidget<TObject, TValue> =
  VisualizationSettingDefinition<TObject, TValue, unknown> & {
    id: string;
    value: TValue;
    set: boolean;
    widget: any;
    onChange: (newValue: TValue, question: Question) => void;
    onChangeSettings: (
      newSettings: VisualizationSettings,
      question: Question,
    ) => void;
  };

export type VisualizationGridSize = {
  // grid columns
  width: number;
  // grid rows
  height: number;
};

export type VisualizationProperties = {
  noun?: string;
  uiName: string;
  identifier: string;
  aliases?: string[];
  iconName: IconName;

  maxMetricsSupported?: number;
  maxDimensionsSupported?: number;

  disableClickBehavior?: boolean;
  canSavePng?: boolean;
  noHeader: boolean;
  hidden?: boolean;
  disableSettingsConfig?: boolean;
  supportPreviewing?: boolean;
  supportsSeries?: boolean;

  minSize: VisualizationGridSize;
  defaultSize: VisualizationGridSize;

  settings: VisualizationSettingsDefinitions;

  placeHolderSeries?: Series;

  transformSeries?: (series: Series) => TransformedSeries;
  // TODO: remove dependency on metabase-lib
  isSensible?: (data: DatasetData, query?: Query) => boolean;
  // checkRenderable throws an error if a visualization is not renderable
  checkRenderable: (
    series: Series,
    settings: VisualizationSettings,
    query: Query,
  ) => void | never;
  isLiveResizable?: (series: Series) => boolean;
  onDisplayUpdate?: (settings: VisualizationSettings) => VisualizationSettings;
};

// TODO: add component property for the react component instead of the intersection
export type Visualization = React.ComponentType<VisualizationProps> &
  VisualizationProperties & {
    name: string; // name of this visualization’s `class` or `function`
  };
