import { type ReactNode, type ButtonHTMLAttributes } from "react";

export type RootProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  collapsedLabel?: ReactNode;
  expandedLabel?: ReactNode;
};

export type ContentProps = {
  children: ReactNode;
  className?: string;
};

export type GroupContextValue = {
  open: boolean;
  toggle: () => void;
  contentId: string;
};