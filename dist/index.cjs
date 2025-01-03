"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  TextDirection: () => TextDirection,
  default: () => src_default,
  getTextDirection: () => getTextDirection
});
module.exports = __toCommonJS(src_exports);
var import_core = require("@tiptap/core");
var import_state = require("@tiptap/pm/state");
var RTL = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
var LTR = "A-Za-z\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF";
var RTL_REGEX = new RegExp("^[^" + LTR + "]*[" + RTL + "]");
var LTR_REGEX = new RegExp("^[^" + RTL + "]*[" + LTR + "]");
function getTextDirection(text) {
  if (text.length == 0) {
    return null;
  }
  if (RTL_REGEX.test(text)) {
    return "rtl";
  }
  if (LTR_REGEX.test(text)) {
    return "ltr";
  }
  return null;
}
var validDirections = ["ltr", "rtl", "auto"];
var isComposing = false;
var compositionTimeout;
function TextDirectionPlugin({ types }) {
  return new import_state.Plugin({
    key: new import_state.PluginKey("textDirection"),
    appendTransaction: (transactions, oldState, newState) => {
      if (isComposing) {
        return null;
      }
      const docChanges = transactions.some(
        (transaction) => transaction.docChanged
      );
      if (!docChanges) {
        return;
      }
      let modified = false;
      const tr = newState.tr;
      newState.doc.descendants((node, pos) => {
        if (types.includes(node.type.name)) {
          if (node.attrs.dir !== null && node.textContent.length > 0) {
            return;
          }
          const marks = tr.storedMarks || [];
          tr.setNodeAttribute(pos, "dir", getTextDirection(node.textContent));
          for (const mark of marks) {
            tr.addStoredMark(mark);
          }
          modified = true;
        }
      });
      return modified ? tr : null;
    },
    props: {
      handleDOMEvents: {
        compositionstart: () => {
          if (!isComposing) {
            isComposing = true;
            clearTimeout(compositionTimeout);
            compositionTimeout = setTimeout(() => {
              isComposing = false;
            }, 2e3);
          }
          return false;
        },
        compositionend: () => {
          isComposing = false;
          clearTimeout(compositionTimeout);
          return false;
        }
      }
    }
  });
}
var TextDirection = import_core.Extension.create({
  name: "textDirection",
  addOptions() {
    return {
      types: [],
      defaultDirection: null
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: (element) => element.dir || this.options.defaultDirection,
            renderHTML: (attributes) => {
              if (attributes.dir === this.options.defaultDirection) {
                return {};
              }
              return { dir: attributes.dir };
            }
          }
        }
      }
    ];
  },
  addCommands() {
    return {
      setTextDirection: (direction) => ({ commands }) => {
        if (!validDirections.includes(direction)) {
          return false;
        }
        return this.options.types.every(
          (type) => commands.updateAttributes(type, { dir: direction })
        );
      },
      unsetTextDirection: () => ({ commands }) => {
        return this.options.types.every(
          (type) => commands.resetAttributes(type, "dir")
        );
      }
    };
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Alt-l": () => this.editor.commands.setTextDirection("ltr"),
      "Mod-Alt-r": () => this.editor.commands.setTextDirection("rtl")
    };
  },
  addProseMirrorPlugins() {
    return [
      TextDirectionPlugin({
        types: this.options.types
      })
    ];
  }
});
var src_default = TextDirection;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TextDirection,
  getTextDirection
});
