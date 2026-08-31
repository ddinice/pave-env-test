import styles from "./style.module.css";
import { Props } from "./types";

export const Avatar = ({ name, bg, aria }: Props) => {
  return (
    <span
      aria-label={aria}
      className={styles.avatar}
      style={{
        background: bg,
      }}
    >
      {name ? name : "?"}
    </span>
  );
};
