import { FORMATS } from "../../app/constants/pull.constant";
import { cn } from "../../lib/utils";
import { Tooltip } from "../ui/tooltip";

export const PullFormats = () => {
  return (
    <div>
      <p className="tags">
        <span className="external-key">Format</span>
        {FORMATS.map((i) => {
          return (
            <Tooltip key={i.id} label={i.tooltipText}>
              <span className={cn("tag", i.isActive && "tag-active")}>
                {i.title}
              </span>
            </Tooltip>
          );
        })}
      </p>
    </div>
  );
};
