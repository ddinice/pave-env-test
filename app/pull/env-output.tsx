import { Fragment } from "react";

import styles from "./env-output.module.css";

function EnvOutputLine({ line }: { line: string }) {
  if (line.startsWith("#")) {
    const isDisabledEntry = /^#[^=\s][^=]*=/.test(line);
    return (
      <span className={isDisabledEntry ? styles.disabled : styles.comment}>
        {line}
      </span>
    );
  }

  const eq = line.indexOf("=");
  if (eq === -1) return <span>{line}</span>;

  return (
    <>
      <span className={styles.key}>{line.slice(0, eq)}</span>
      <span className={styles.operator}>=</span>
      <span className={styles.value}>{line.slice(eq + 1)}</span>
    </>
  );
}

export function EnvOutput({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <pre aria-label="Filled .env" className={styles.output}>
      <code>
        {lines.map((line, index) => (
          <Fragment key={index}>
            <EnvOutputLine line={line} />
            {index < lines.length - 1 ? "\n" : null}
          </Fragment>
        ))}
      </code>
    </pre>
  );
}
