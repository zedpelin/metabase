import { State } from "metabase-types/store";
import { PLUGIN_WHITELABEL } from "metabase/plugins";

export function getWhiteLabeledLoadingMessage(state: State) {
  return PLUGIN_WHITELABEL.getLoadingMessage(state);
}

export function getIsWhiteLabeling(state: State) {
  return PLUGIN_WHITELABEL.getIsWhiteLabeling(state);
}
