type LegalJurisdictionNoteProps = {
  children: React.ReactNode;
};

export function LegalJurisdictionNote({ children }: LegalJurisdictionNoteProps) {
  return (
    <p className="mt-6 type-body-sm text-cited-ink-subtle">{children}</p>
  );
}
