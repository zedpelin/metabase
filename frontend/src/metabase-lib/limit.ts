import {
  current_limit as _current_limit,
  limit as _limit,
} from "cljs/metabase.lib.core";
import type { Query, Limit } from "./types";

const DEFAULT_STAGE_INDEX = -1;

export function currentLimit(
  query: Query,
  stageIndex = DEFAULT_STAGE_INDEX,
): Limit {
  return _current_limit(query, stageIndex);
}

declare function LimitFn(query: Query, limit: Limit): Query;
declare function LimitFn(query: Query, stageIndex: number, limit: Limit): Query;

export const limit: typeof LimitFn = _limit;

export function hasLimit(query: Query, stageIndex = DEFAULT_STAGE_INDEX) {
  const limit = currentLimit(query, stageIndex);
  return typeof limit === "number" && limit > 0;
}
