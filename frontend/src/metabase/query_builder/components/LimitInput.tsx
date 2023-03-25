import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const DEFAULT_STYLE = {
  borderWidth: 2,
};

const propTypes = {
  className: PropTypes.string,
  small: PropTypes.bool,
  medium: PropTypes.bool,
  style: PropTypes.object,
};

interface LimitStepProps extends React.HTMLProps<HTMLInputElement> {
  small?: boolean;
  medium?: boolean;
}

const LimitInput = ({
  className,
  small,
  medium,
  style = {},
  ...props
}: LimitStepProps) => (
  <input
    className={cx("input", className, {
      // HACK: reuse Button styles
      "Button--small": small,
      "Button-medium": medium,
    })}
    style={{ ...DEFAULT_STYLE, ...style }}
    {...props}
  />
);

LimitInput.propTypes = propTypes;

export default LimitInput;
