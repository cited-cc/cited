type LegalSectionData = {
  id: string;
  number?: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: {
    id: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
};

type LegalSectionProps = {
  section: LegalSectionData;
};

function SectionBody({
  paragraphs,
  bullets,
}: {
  paragraphs: string[];
  bullets?: string[];
}) {
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}:${paragraph.slice(0, 24)}`}
          className="mt-3 type-body text-cited-ink-muted"
        >
          {paragraph}
        </p>
      ))}
      {bullets && bullets.length > 0 ? (
        <ul className="mt-4 list-disc space-y-2 pl-5 type-body text-cited-ink-muted">
          {bullets.map((item, index) => (
            <li key={`${index}:${item.slice(0, 24)}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function LegalSection({ section }: LegalSectionProps) {
  const heading = section.number
    ? `${section.number}. ${section.title}`
    : section.title;

  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="type-title text-cited-ink">{heading}</h2>
      <SectionBody paragraphs={section.paragraphs} bullets={section.bullets} />
      {section.subsections?.map((subsection) => (
        <div key={subsection.id} id={subsection.id} className="mt-6 scroll-mt-24">
          <h3 className="type-body font-medium text-cited-ink">
            {subsection.title}
          </h3>
          <SectionBody
            paragraphs={subsection.paragraphs}
            bullets={subsection.bullets}
          />
        </div>
      ))}
    </section>
  );
}
