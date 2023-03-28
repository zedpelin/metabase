import React from "react";
import { t } from "ttag";

import LimitInput from "metabase/query_builder/components/LimitInput";
import type { NotebookStep } from "metabase/query_builder/components/notebook/lib/steps.types";

import * as Lib from "metabase-lib";
import type { Query } from "metabase-lib/types";

import { NotebookCell } from "../../NotebookCell";

interface LimitStepProps {
  step: NotebookStep;
  color: string;
  updateQuery: (query: Query) => void;
}

function LimitStep({ step, color, updateQuery }: LimitStepProps) {
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
