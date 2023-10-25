/* eslint "react/prop-types": "warn" */
import { memo } from "react";
import PropTypes from "prop-types";

const S = {};

const List = ({ children }) => <ul className={S.list}>{children}</ul>;

List.propTypes = {
  children: PropTypes.any.isRequired,
};

export default memo(List);
