import { formatTime } from "./time";
import styles from "./Thumbnails.module.css";
import type { Thumbnail } from "./types";

interface ThumbnailsProps {
  items: readonly Thumbnail[];
  disabled?: boolean;
  onSetStart: (timeSecs: number) => void;
  onSetEnd: (timeSecs: number) => void;
}

export function Thumbnails({ items, disabled = false, onSetStart, onSetEnd }: ThumbnailsProps) {
  return (
    <ul className={styles.grid}>
      {items.map((item) => {
        const label = formatTime(item.time_secs);
        return (
          <li key={item.time_secs} className={styles.tile}>
            <img className={styles.img} src={item.data_url} alt={`Fotograma en ${label}`} />
            <span className={styles.time}>{label}</span>
            <div className={styles.actions}>
              <button type="button" className={styles.set} disabled={disabled} onClick={() => onSetStart(item.time_secs)}>
                Inicio
              </button>
              <button type="button" className={styles.set} disabled={disabled} onClick={() => onSetEnd(item.time_secs)}>
                Fin
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
