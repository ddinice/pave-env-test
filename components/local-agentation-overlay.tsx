"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import type { AgentationProps } from "agentation";

const Agentation = dynamic(
  async () => {
    const module = await import("agentation");
    return module.Agentation as ComponentType<AgentationProps>;
  },
  { ssr: false },
);

export function LocalAgentationOverlay() {
  if (process.env.NEXT_PUBLIC_ENABLE_AGENTATION !== "1") return null;

  return <Agentation copyToClipboard />;
}
