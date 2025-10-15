// src/index.ts
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
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
  return new Plugin({
    key: new PluginKey("textDirection"),
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
var TextDirection = Extension.create({
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
var index_default = TextDirection;
export {
  TextDirection,
  index_default as default,
  getTextDirection
};
