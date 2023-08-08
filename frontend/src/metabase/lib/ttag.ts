import { t as _t, ngettext as _ngettext, jt as _jt } from "ttag";
import { PLUGIN_WHITELABEL } from "metabase/plugins";

export const t: typeof _t = (...args) => {
  const text = _t(...args);
  return PLUGIN_WHITELABEL.getWhitelabelMessage(text);
};

export const ngettext: typeof _ngettext = (...args) => {
  const text = _ngettext(...args);
  return PLUGIN_WHITELABEL.getWhitelabelMessage(text);
};

export const jt: typeof _jt = (...args) => {
  const node = _jt(...args);
  return Array.isArray(node)
    ? node.map(text => PLUGIN_WHITELABEL.getWhitelabelMessage(text))
    : node;
};
