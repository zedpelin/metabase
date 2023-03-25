import React from "react";
import { t } from "ttag";

import LimitInput from "metabase/query_builder/components/LimitInput";
import type StructuredQuery from "metabase-lib/queries/StructuredQuery";

import { NotebookCell } from "../NotebookCell";

interface LimitStepProps {
  query: StructuredQuery;
  color: string;
  updateQuery: (query: StructuredQuery) => void;
}

function LimitStep({ color, query, updateQuery }: LimitStepProps) {
  const limit = query.limit();
  const value = typeof limit === "number" ? limit : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limit = parseInt(e.target.value, 10);
    if (limit >= 1) {
      updateQuery(query.updateLimit(limit));
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
