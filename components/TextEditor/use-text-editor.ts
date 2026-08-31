"use client";

import { useCallback, useRef, type KeyboardEvent, type RefObject } from "react";

const INDENT = "  ";

function insertText(el: HTMLTextAreaElement, text: string) {
  el.focus();
  if (!document.execCommand("insertText", false, text)) {
    const { selectionStart: s, selectionEnd: e } = el;
    el.setRangeText(text, s, e, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function replaceRange(
  el: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
) {
  el.focus();
  el.setSelectionRange(start, end);
  insertText(el, text);
}

function lineBounds(value: string, start: number, end: number) {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  let to = value.indexOf("\n", end);
  if (to === -1) to = value.length;
  return { from, to };
}

export function useTextEditor(ref: RefObject<HTMLTextAreaElement | null>) {
  const escaped = useRef(false);

  const indent = useCallback((el: HTMLTextAreaElement, outdent: boolean) => {
    const { selectionStart: s, selectionEnd: e, value } = el;

    if (s === e && !outdent) {
      insertText(el, INDENT);
      return;
    }

    const { from, to } = lineBounds(value, s, e);
    const block = value.slice(from, to);

    const next = block
      .split("\n")
      .map((line) =>
        outdent
          ? line.replace(new RegExp(`^ {1,${INDENT.length}}`), "")
          : INDENT + line,
      )
      .join("\n");

    replaceRange(el, from, to, next);
    el.setSelectionRange(from, from + next.length);
  }, []);

  const autoIndent = useCallback((el: HTMLTextAreaElement) => {
    const { selectionStart: s, value } = el;
    const from = value.lastIndexOf("\n", s - 1) + 1;
    const lead = value.slice(from, s).match(/^[ \t]*/)?.[0] ?? "";
    const opensBlock = /[{[]\s*$/.test(value.slice(from, s));
    insertText(el, "\n" + lead + (opensBlock ? INDENT : ""));
  }, []);

  const format = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text.startsWith("{") && !text.startsWith("[")) return;
    try {
      const pretty = JSON.stringify(JSON.parse(text), null, INDENT.length);
      replaceRange(el, 0, el.value.length, pretty);
    } catch {
      // leave invalid JSON untouched; the parse error is surfaced elsewhere
    }
  }, [ref]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;

      if (event.key === "Escape") {
        escaped.current = true;
        return;
      }

      if (event.key === "Tab") {
        if (escaped.current) {
          escaped.current = false;
          return;
        }
        event.preventDefault();
        indent(el, event.shiftKey);
        return;
      }

      escaped.current = false;

      if (event.key === "Enter" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        autoIndent(el);
        return;
      }

      if (
        event.key.toLowerCase() === "f" &&
        event.shiftKey &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        format();
      }
    },
    [indent, autoIndent, format],
  );

  return { onKeyDown, format };
}