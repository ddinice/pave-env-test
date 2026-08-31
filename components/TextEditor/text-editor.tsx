"use client";

import { useRef } from "react";
import { Textarea } from "../ui/Textarea/textarea"
import { useTextEditor } from "./use-text-editor";
import type { Props } from "./types";

export function TextEditor({ setText, ref, onKeyDown, ...props }: Props) {
  const inner = useRef<HTMLTextAreaElement>(null);
  const { onKeyDown: handleKeys } = useTextEditor(inner);

  return (
    <Textarea
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented) handleKeys(e);
      }}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      {...props}
      onChange={(e) => setText(e.target.value)}
    />
  );
}