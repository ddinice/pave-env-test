import { PullStatProps } from "./types";
import styles from "./styles.module.css";

export const PullStats = ({ stats }: { stats: PullStatProps | null }) => {
  return (
    <>
      {
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>Filled</span>
            <strong>{stats && stats.filled ? stats.filled : 0}</strong>
          </div>
          <div className={styles.stat}>
            <span>Not found</span>
            <strong>
              {stats && stats.notFound.length ? stats.notFound.length : 0}
            </strong>
          </div>
          <div className={styles.stat}>
            <span>Stale</span>
            <strong>
              {stats && stats.stale.length ? stats.stale.length : 0}
            </strong>
          </div>
        </div>
      }

      {stats && stats.notFound.length > 0 ? (
        <div className={styles.warning} role="alert">
          <strong>Not in the registry — left untouched</strong>
          <span>{stats.notFound.join(" · ")}</span>
        </div>
      ) : null}

      {stats && stats.stale.length > 0 ? (
        <div className={styles.notice} role="status">
          <strong>Refreshed from a newer value</strong>
          <span>{stats.stale.join(", ")}</span>
        </div>
      ) : null}
    </>
  );
};
