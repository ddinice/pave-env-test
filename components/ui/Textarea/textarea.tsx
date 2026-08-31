import { cn } from "../../../lib/utils";
import styles from "./style.module.css";
import type { Props } from "./types";

export function Textarea({ className, ...props }: Props) {
  return <textarea className={cn(styles.textarea, className)} {...props} />;
}
