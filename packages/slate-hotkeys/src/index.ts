import { isKeyHotkey } from "is-hotkey";
import { IS_IOS, IS_MAC } from "@zykj/slate-dev-environment";

/**
 * Hotkey mappings for each platform.
 * @type {Object}
 */

const HOTKEYS: any = {
  bold: "mod+b",
  compose: ["down", "left", "right", "up", "backspace", "enter"],
  moveBackward: "mod?+ctrl?+alt?+left",
  moveForward: "mod?+ctrl?+alt?+right",
  deleteBackward: "shift?+backspace",
  deleteForward: "shift?+delete",
  extendBackward: "shift+left",
  extendForward: "shift+right",
  italic: "mod+i",
  splitBlock: "shift?+enter",
  undo: "mod+z"
};

const APPLE_HOTKEYS: any = {
  moveLineBackward: "opt+up",
  moveLineForward: "opt+down",
  deleteBackward: ["ctrl+backspace", "ctrl+h"],
  deleteForward: ["ctrl+delete", "ctrl+d"],
  deleteLineBackward: "cmd+shift?+backspace",
  deleteLineForward: ["cmd+shift?+delete", "ctrl+k"],
  deleteWordBackward: "opt+shift?+backspace",
  deleteWordForward: "opt+shift?+delete",
  extendLineBackward: "opt+shift+up",
  extendLineForward: "opt+shift+down",
  redo: "cmd+shift+z",
  transposeCharacter: "ctrl+t"
};

const WINDOWS_HOTKEYS: any = {
  deleteWordBackward: "ctrl+shift?+backspace",
  deleteWordForward: "ctrl+shift?+delete",
  redo: "ctrl+y"
};

/**
 * Hotkeys.
 *
 * @type {Object}
 */
const Hotkeys: any = {};

const IS_APPLE = IS_IOS || IS_MAC;
const IS_WINDOWS = !IS_APPLE;
const KEYS: any[] = ([] as any[])
  .concat(Object.keys(HOTKEYS))
  .concat(Object.keys(APPLE_HOTKEYS))
  .concat(Object.keys(WINDOWS_HOTKEYS));
KEYS.forEach(key => {
  const method = `is${key[0].toUpperCase()}${key.slice(1)}`;
  if (Hotkeys[method]) return;
  const generic = HOTKEYS[key];
  const apple = APPLE_HOTKEYS[key];
  const windows = WINDOWS_HOTKEYS[key];
  const isGeneric = generic && isKeyHotkey(generic);
  const isApple = apple && isKeyHotkey(apple);
  const isWindows = windows && isKeyHotkey(windows);
  Hotkeys[method] = event => {
    if (isGeneric && isGeneric(event)) return true;
    if (IS_APPLE && isApple && isApple(event)) return true;
    if (IS_WINDOWS && isWindows && isWindows(event)) return true;
    return false;
  };
});

/**
 * Export.
 *
 * @type {Object}
 */

export default Hotkeys;
