/**
 * Textus's per-document undo-file journal. Drifting keeps its own history and
 * a chapter is not a file, so nothing is ever stored or restored here.
 */
export const undoFiles = {
  async load(
    _path: string,
    _hash: string,
  ): Promise<string | null> {
    return null;
  },
  async save(
    _path: string,
    _hash: string,
    _history: string,
  ): Promise<void> {},
  async begin(_path: string | null): Promise<null> {
    return null;
  },
  async end(_path: string | null): Promise<void> {},
};
