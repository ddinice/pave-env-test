import { useState } from "react";

import { Badge } from "./ui/badge";
import { Table } from "./ui/table";
import { designVariablePublicId } from "../lib/design-variables/public-id";
import { Tooltip } from "./ui/tooltip";
import type { DesignVariableRecord } from "../lib/design-variables/types";
import { CopyButton } from "./ui/CopyButton/copy-button";
import { LockIcon } from "./icons/icons";

export function DesignVariableTable({
  onSelect,
  variables,
}: {
  onSelect: (externalKey: string) => void;
  variables: DesignVariableRecord[];
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <Table>
      <caption className="sr-only">Design variable registry</caption>
      <tbody>
        {variables.map((variable) => {
          const id = designVariablePublicId(variable.externalKey);
          return (
            <tr
              aria-label={`Open ${id}: ${variable.name}`}
              className="variable-row"
              data-external-key={variable.externalKey}
              key={variable.externalKey}
              onClick={() => onSelect(variable.externalKey)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(variable.externalKey);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <th scope="row">
                <span className="variable-link">
                  <span className="external-key" translate="no">
                    {id}
                  </span>
                  <span className="protection-slot">
                    {variable.isProtected ? (
                      <Tooltip label="Protected variable">
                        <Badge
                          aria-label="Protected variable"
                          className="status-badge protected-status"
                        >
                          <LockIcon />
                          <span className="sr-only">Protected</span>
                        </Badge>
                      </Tooltip>
                    ) : null}
                  </span>
                  <span>{variable.name}</span>
                  <span className="variable-subsystem">
                    › {variable.subsystem}
                  </span>
                </span>
              </th>
              <td
                className="value-cell"
                onMouseEnter={() => setHoveredKey(variable.externalKey)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <CopyButton
                  isHover={hoveredKey === variable.externalKey}
                  value={variable.value}
                />
                <span>{variable.value}</span>{" "}
                <span className="unit">{variable.unit}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
