"use client";

import { createContext, useContext, useId, useState } from "react";
import { GroupContextValue, RootProps, TriggerProps } from "./types";
import { ContentProps } from "vaul";
import { ChevronsUpDownIcon } from "../icons/icons";
import { cn } from "../../lib/utils";
import style from "./style.module.css";

const GroupContext = createContext<GroupContextValue | null>(null);

function useGroup(component: string) {
  const ctx = useContext(GroupContext);
  if (!ctx) {
    throw new Error(
      `${component} must be used inside <CollapsedActivityGroup>`,
    );
  }
  return ctx;
}

function Root({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className = "",
}: RootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const contentId = useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    const next = !open;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <GroupContext.Provider value={{ open, toggle, contentId }}>
      <div className={className}>{children}</div>
    </GroupContext.Provider>
  );
}

function Trigger({
  children,
  collapsedLabel,
  expandedLabel,
  className = "",
  ...rest
}: TriggerProps) {
  const { open, toggle, contentId } = useGroup(
    "CollapsedActivityGroup.Trigger",
  );

  const label = open
    ? (expandedLabel ?? children)
    : (collapsedLabel ?? children);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={contentId}
      className={cn(style.trigger, className)}
      {...rest}
    >
      <ChevronsUpDownIcon height="14" width="14" />
      <span className="activity-group-trigger-label">{label}</span>
    </button>
  );
}

function Content({ children, className = "" }: ContentProps) {
  const { open, contentId } = useGroup("CollapsedActivityGroup.Content");

  return (
    <div
      id={contentId}
      inert={!open}
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      className={cn(style.rows, className)}
    >
      <div className={style.clip}>
        <div className={style.fade} style={{ opacity: open ? 1 : 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export const CollapsedActivityGroup = Object.assign(Root, {
  Trigger,
  Content,
});
