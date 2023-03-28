import React from "react";
import { t } from "ttag";

import LimitInput from "metabase/query_builder/components/LimitInput";

import * as Lib from "metabase-lib";

import { NotebookStepUiComponentProps } from "../../lib/steps.types";
import { NotebookCell } from "../../NotebookCell";

function LimitStep({ step, color, updateQuery }: NotebookStepUiComponentProps) {
  const { topLevelQuery: query, stageIndex } = step;

  const limit = Lib.currentLimit(query, step.stageIndex);
  const value = typeof limit === "number" ? limit : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limit = parseInt(e.target.value, 10);
    if (limit >= 1) {
      updateQuery(Lib.limit(query, stageIndex, limit));
    }
  };

  return (
    <NotebookCell color={color}>
      <LimitInput
        className="mb1"
        type="number"
        value={value}
        placeholder={t`Enter a limit`}
        small
        onChange={handleChange}
      />
    </NotebookCell>
  );
}

export default LimitStep;
