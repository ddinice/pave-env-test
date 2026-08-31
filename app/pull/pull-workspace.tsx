"use client";

import { useMemo, useRef, useState, useTransition } from "react";

import { Button } from "../../components/ui/button";
import { CopyButton } from "../../components/ui/CopyButton/copy-button";
import { TextEditor } from "../../components/TextEditor/text-editor";
import { cn } from "../../lib/utils";
import { EDITOR_PLACEHOLDER } from "../constants/pull.constant";
import { generateStarterFromModel } from "./actions";
import { EnvOutput } from "./env-output";
import { parseEnv } from "./env";
import styles from "./style.module.css";
import { useEnvFiller } from "./use-env-filler";
import { PullStats } from "../../components/PullStats/pull-stats";
import { PullFormats } from "../../components/PullFormats/pull-formats";

export function PullWorkspace({
  models,
}: {
  models: { id: string; name: string }[];
}) {
  const {
    text,
    setText,
    fill,
    output,
    stats,
    isPending,
    formatted,
    setFormatted,
  } = useEnvFiller();
  const [starterModelId, setStarterModelId] = useState("");
  const [isGeneratingStarter, startGeneratingStarter] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const keyCount = useMemo(
    () => parseEnv(text).filter((line) => line.type === "entry").length,
    [text],
  );

  function startFromModel() {
    if (!starterModelId) return;
    startGeneratingStarter(async () => {
      const starter = await generateStarterFromModel(starterModelId);
      const el = textareaRef.current;

      if (el) {
        el.focus();
        el.select();
        if (!document.execCommand("insertText", false, starter)) {
          el.value = starter;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else {
        setText(starter);
      }
    });
  }

  return (
    <>
      <PullFormats /> 
      {models.length > 0 ? (
        <>
          <div className={styles.toolbar}>
          <span className="external-key">Model</span>
            <select
              aria-label="Start from a model"
              onChange={(event) => setStarterModelId(event.target.value)}
              value={starterModelId}
            >
              <option value="">Start from a model…</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <Button
              className={cn("button-secondary", styles.model_btn)}
              disabled={!starterModelId || isGeneratingStarter}
              onClick={startFromModel}
              type="button"
            >
              {isGeneratingStarter ? "Generating…" : "Use model"}
            </Button>
          </div>
        </>
      ) : null}
      <PullStats stats={stats} />
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.columnHeading}>
            <span className="eyebrow">Input</span>
            <span className="status-badge">{keyCount} keys detected</span>
          </div>

          <TextEditor
            aria-label="Input .env file"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                fill();
              }
            }}
            placeholder={EDITOR_PLACEHOLDER}
            ref={textareaRef}
            setText={setText}
            style={{ height: "500px" }}
          />
          <div>
            <Button
              className={cn(isPending && styles.pending)}
              disabled={!text.trim() || isPending}
              onClick={fill}
              type="button"
            >
              {isPending ? "Filling…" : "Fill values"}
            </Button>
          </div>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeading}>
            <span className="eyebrow">Result</span>
            <span className="status-badge">
              {stats && stats?.filled ? stats.filled : 0} keys fiiled
            </span>
          </div>
          {output ? (
            <EnvOutput text={output} />
          ) : (
            <p className={styles.empty}>Fill values to see the result here.</p>
          )}
          <label className={styles.formatToggle}>
            <input
              checked={formatted}
              onChange={(event) => setFormatted(event.target.checked)}
              type="checkbox"
            />
            Group by subsystem
          </label>
          {output ? (
            <div className={styles.resultFooter}>
              <CopyButton
                ariaLabel="Copy .env"
                isHover
                label="Copy"
                value={output}
              />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
