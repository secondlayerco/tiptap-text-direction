import { Extension } from '@tiptap/core';

declare function getTextDirection(text: string): "ltr" | "rtl" | null;
declare const validDirections: readonly ["ltr", "rtl", "auto"];
type Direction = (typeof validDirections)[number];
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        textDirection: {
            /**
             * Set the text direction attribute
             */
            setTextDirection: (direction: Direction) => ReturnType;
            /**
             * Unset the text direction attribute
             */
            unsetTextDirection: () => ReturnType;
        };
    }
}
interface TextDirectionOptions {
    types: string[];
    defaultDirection: Direction | null;
}
declare const TextDirection: Extension<TextDirectionOptions, any>;

export { TextDirection, type TextDirectionOptions, TextDirection as default, getTextDirection };
