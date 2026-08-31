import type { TextareaHTMLAttributes, Ref } from "react";

export type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
};
