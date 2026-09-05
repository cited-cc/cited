/**
 * Normalize provider markdown into readable plain text for evidence UI.
 * Security: output is plain text only (no HTML). Used at ingest and display.
 */

export type EvidenceTextLine = {
  text: string;
  start: number;
  end: number;
};

export type EvidenceTextBlock =
  | {
      kind: "heading";
      level: 2 | 3 | 4;
      text: string;
      start: number;
      end: number;
    }
  | {
      kind: "paragraph";
      text: string;
      start: number;
      end: number;
    }
  | {
      kind: "unordered-list";
      items: EvidenceTextLine[];
      start: number;
      end: number;
    }
  | {
      kind: "ordered-list";
      items: EvidenceTextLine[];
      start: number;
      end: number;
    };

export type FormattedProviderText = {
  text: string;
  blocks: EvidenceTextBlock[];
};

function normalizeInlineMarkdown(segment: string): string {
  return segment
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .trimEnd();
}

function headingLevel(markers: string): 2 | 3 | 4 {
  if (markers.length <= 2) return 2;
  if (markers.length <= 4) return 3;
  return 4;
}

function isBlankLine(line: string): boolean {
  return line.trim().length === 0;
}

/**
 * Convert provider markdown into plain text plus structured blocks for typography.
 */
export function formatProviderText(raw: string | null | undefined): FormattedProviderText {
  if (!raw?.trim()) {
    return { text: "", blocks: [] };
  }

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: EvidenceTextBlock[] = [];
  const parts: string[] = [];
  let cursor = 0;

  const appendSegment = (segment: string) => {
    parts.push(segment);
    cursor += segment.length;
  };

  const appendParagraphBreak = () => {
    if (parts.length === 0 || parts[parts.length - 1] === "\n\n") return;
    appendSegment("\n\n");
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (isBlankLine(line)) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      appendParagraphBreak();
      const text = normalizeInlineMarkdown(headingMatch[2] ?? "");
      const start = cursor;
      appendSegment(text);
      blocks.push({
        kind: "heading",
        level: headingLevel(headingMatch[1] ?? "##"),
        text,
        start,
        end: cursor,
      });
      appendParagraphBreak();
      index += 1;
      continue;
    }

    const unorderedMatch = line.match(/^[-*+•]\s+(.+)$/);
    if (unorderedMatch) {
      appendParagraphBreak();
      const items: EvidenceTextLine[] = [];
      const blockStart = cursor;

      while (index < lines.length) {
        const current = lines[index] ?? "";
        const itemMatch = current.match(/^[-*+•]\s+(.+)$/);
        if (!itemMatch) break;
        const itemText = `- ${normalizeInlineMarkdown(itemMatch[1] ?? "")}`;
        const itemStart = cursor;
        appendSegment(itemText);
        items.push({ text: itemText, start: itemStart, end: cursor });
        appendSegment("\n");
        index += 1;
      }

      if (parts[parts.length - 1] === "\n") {
        parts.pop();
        cursor -= 1;
      }

      blocks.push({
        kind: "unordered-list",
        items,
        start: blockStart,
        end: cursor,
      });
      appendParagraphBreak();
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      appendParagraphBreak();
      const items: EvidenceTextLine[] = [];
      const blockStart = cursor;

      while (index < lines.length) {
        const current = lines[index] ?? "";
        const itemMatch = current.match(/^(\d+)[.)]\s+(.+)$/);
        if (!itemMatch) break;
        const itemText = `${itemMatch[1]}. ${normalizeInlineMarkdown(itemMatch[2] ?? "")}`;
        const itemStart = cursor;
        appendSegment(itemText);
        items.push({ text: itemText, start: itemStart, end: cursor });
        appendSegment("\n");
        index += 1;
      }

      if (parts[parts.length - 1] === "\n") {
        parts.pop();
        cursor -= 1;
      }

      blocks.push({
        kind: "ordered-list",
        items,
        start: blockStart,
        end: cursor,
      });
      appendParagraphBreak();
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && !isBlankLine(lines[index] ?? "")) {
      const current = lines[index] ?? "";
      if (
        current.match(/^(#{1,6})\s+/) ||
        current.match(/^[-*+•]\s+/) ||
        current.match(/^\d+[.)]\s+/)
      ) {
        break;
      }
      paragraphLines.push(normalizeInlineMarkdown(current));
      index += 1;
    }

    const text = paragraphLines.join("\n").trim();
    if (!text) continue;

    appendParagraphBreak();
    const start = cursor;
    appendSegment(text);
    blocks.push({
      kind: "paragraph",
      text,
      start,
      end: cursor,
    });
    appendParagraphBreak();
  }

  const text = parts.join("").replace(/\n{3,}/g, "\n\n").trim();
  return { text, blocks: remapBlocksToText(blocks, text) };
}

function remapBlocksToText(
  blocks: EvidenceTextBlock[],
  text: string,
): EvidenceTextBlock[] {
  if (blocks.length === 0) return [];

  let searchFrom = 0;
  return blocks.map((block) => {
    if (block.kind === "unordered-list" || block.kind === "ordered-list") {
      const items = block.items.map((item) => {
        const idx = text.indexOf(item.text, searchFrom);
        const start = idx >= 0 ? idx : searchFrom;
        const end = start + item.text.length;
        searchFrom = end;
        return { text: item.text, start, end };
      });
      const start = items[0]?.start ?? 0;
      const end = items[items.length - 1]?.end ?? start;
      return { ...block, items, start, end };
    }

    const idx = text.indexOf(block.text, searchFrom);
    const start = idx >= 0 ? idx : searchFrom;
    const end = start + block.text.length;
    searchFrom = end;
    return { ...block, start, end };
  });
}

/** Plain-text normalization without block metadata. */
export function normalizeProviderText(raw: string | null | undefined): string {
  return formatProviderText(raw).text;
}
