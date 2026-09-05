import type { Subprocessor } from "@/lib/content/legal";

type LegalDefinitionListProps = {
  items: Subprocessor[];
};

export function LegalSubprocessorTable({ items }: LegalDefinitionListProps) {
  return (
    <div className="mt-8">
      <ul className="grid list-none gap-4 p-0 md:hidden">
        {items.map((item) => (
          <li
            key={item.name}
            className="rounded-md border border-cited-line bg-cited-surface px-4 py-4"
          >
            <a
              href={item.privacyUrl}
              target="_blank"
              rel="noreferrer"
              className="type-title text-base text-cited-ink underline-offset-4 hover:underline"
            >
              {item.name}
            </a>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="type-meta text-cited-ink-subtle">Purpose</dt>
                <dd className="mt-0.5 type-body-sm text-cited-ink-muted">
                  {item.purpose}
                </dd>
              </div>
              <div>
                <dt className="type-meta text-cited-ink-subtle">
                  Data categories
                </dt>
                <dd className="mt-0.5 type-body-sm text-cited-ink-muted">
                  {item.dataCategories}
                </dd>
              </div>
              <div>
                <dt className="type-meta text-cited-ink-subtle">Location</dt>
                <dd className="mt-0.5 type-body-sm text-cited-ink-muted">
                  {item.locationNote}
                </dd>
              </div>
              <div>
                <dt className="type-meta text-cited-ink-subtle">Required</dt>
                <dd className="mt-0.5 type-body-sm text-cited-ink-muted">
                  {item.required ? "Required" : "Optional"}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="sr-only">Cited subprocessors</caption>
          <thead>
            <tr className="border-b border-cited-line">
              <th
                scope="col"
                className="py-3 pr-4 type-meta text-cited-ink-subtle"
              >
                Provider
              </th>
              <th
                scope="col"
                className="py-3 pr-4 type-meta text-cited-ink-subtle"
              >
                Purpose
              </th>
              <th
                scope="col"
                className="py-3 pr-4 type-meta text-cited-ink-subtle"
              >
                Data categories
              </th>
              <th
                scope="col"
                className="py-3 pr-4 type-meta text-cited-ink-subtle"
              >
                Location
              </th>
              <th scope="col" className="py-3 type-meta text-cited-ink-subtle">
                Required
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.name}
                className="border-b border-cited-line-subtle align-top"
              >
                <th
                  scope="row"
                  className="py-4 pr-4 type-body-sm text-cited-ink"
                >
                  <a
                    href={item.privacyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 hover:underline"
                  >
                    {item.name}
                  </a>
                </th>
                <td className="py-4 pr-4 type-body-sm text-cited-ink-muted">
                  {item.purpose}
                </td>
                <td className="py-4 pr-4 type-body-sm text-cited-ink-muted">
                  {item.dataCategories}
                </td>
                <td className="py-4 pr-4 type-body-sm text-cited-ink-muted">
                  {item.locationNote}
                </td>
                <td className="py-4 type-body-sm text-cited-ink-muted">
                  {item.required ? "Required" : "Optional"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
