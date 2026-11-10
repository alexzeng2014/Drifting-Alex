/** Small per-window UI state that Textus kept natively; the vendored editor
 *  only remembers which embeds are folded, so localStorage is enough. */
export function getUiState<T>(name: string): T | null {
  try {
    const raw = localStorage.getItem(`textus-ui:${name}`);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function setUiState(name: string, value: unknown): void {
  try {
    localStorage.setItem(`textus-ui:${name}`, JSON.stringify(value));
  } catch {
    // A full or restricted store keeps the editor working without the memo.
  }
}
