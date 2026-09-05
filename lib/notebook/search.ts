/**
 * Notebook search helpers. Search is workspace-scoped and private-safe.
 * Re-exports list query with search filter applied.
 */

export { getNotebookEntries as searchNotebookEntries } from "@/lib/notebook/queries";
export { normalizeNotebookSearch } from "@/lib/notebook/query-state";
