import { memo } from "react";
import PropTypes from "prop-types";
import { t } from "ttag";
const D = {};

import QueryButton from "metabase/components/QueryButton";
const S = {};

const UsefulQuestions = ({ questions }) => (
  <div className={D.detail}>
    <div className={D.detailBody}>
      <div className={D.detailTitle}>
        <span className={D.detailName}>{t`Potentially useful questions`}</span>
      </div>
      <div className={S.usefulQuestions}>
        {questions.map((question, index, questions) => (
          <QueryButton key={index} {...question} />
        ))}
      </div>
    </div>
  </div>
);
UsefulQuestions.propTypes = {
  questions: PropTypes.array.isRequired,
};

export default memo(UsefulQuestions);
