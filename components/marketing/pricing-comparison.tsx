import {
  PLAN_COMPARISON_ROWS,
  PUBLIC_PLAN_KEYS,
  PUBLIC_PLANS,
} from "@/lib/content/plans";
import { cn } from "@/lib/utils";

type PricingComparisonProps = {
  className?: string;
};

function CellValue({ value }: { value: string }) {
  const included = value === "Included";
  const excluded = value === "Not included";
  return (
    <span
      className={cn(
        "type-body-sm",
        included && "text-cited-accent",
        excluded && "text-cited-ink-faint",
        !included && !excluded && "text-cited-ink-muted",
      )}
    >
      {value}
      {included ? <span className="sr-only"> (included)</span> : null}
      {excluded ? <span className="sr-only"> (not included)</span> : null}
    </span>
  );
}

export function PricingComparison({ className }: PricingComparisonProps) {
  return (
    <div className={cn(className)}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-cited-line md:block">
        <p className="sr-only">
          Feature comparison across Founder, Growth, Pro, and Portfolio plans.
          Scroll horizontally if needed.
        </p>
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cited-line-subtle bg-cited-canvas-elevated">
              <th scope="col" className="px-4 py-3 type-micro">
                Feature
              </th>
              {PUBLIC_PLAN_KEYS.map((key) => (
                <th key={key} scope="col" className="px-4 py-3 type-micro">
                  {PUBLIC_PLANS[key].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-cited-line-subtle last:border-b-0"
              >
                <th
                  scope="row"
                  className="px-4 py-3 type-body-sm font-medium text-cited-ink"
                >
                  {row.feature}
                </th>
                {PUBLIC_PLAN_KEYS.map((key) => (
                  <td key={key} className="px-4 py-3">
                    <CellValue value={row[key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card comparison */}
      <div className="space-y-4 md:hidden">
        {PUBLIC_PLAN_KEYS.map((key) => (
          <div
            key={key}
            className="rounded-lg border border-cited-line bg-cited-surface p-4"
          >
            <h3 className="type-title">{PUBLIC_PLANS[key].name}</h3>
            <ul className="mt-4 space-y-2.5">
              {PLAN_COMPARISON_ROWS.map((row) => (
                <li
                  key={`${key}-${row.feature}`}
                  className="flex items-start justify-between gap-3 border-b border-cited-line-subtle pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="type-meta text-cited-ink-subtle">
                    {row.feature}
                  </span>
                  <CellValue value={row[key]} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
