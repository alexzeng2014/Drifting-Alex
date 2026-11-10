/**
 * Stand-in for Textus's native IPC surface, vendored for Drifting-Alex.
 *
 * Drifting mounts only Textus's chapter editor and owns documents, assets and
 * AI itself, so the native commands the editor can reach are inert here: each
 * call answers `null` rather than throwing, and a caller that asks (an image
 * store, a link probe) renders nothing instead of failing an edit.
 */
// `any` members keep the vendored call sites type-checking (they probe for a
// member before calling it) without claiming an API Drifting does not have.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InertModule = Record<string, any>;

const inert = new Proxy(
  {},
  {
    get: () => async () => null,
  },
) as InertModule;

export const fs = inert;
export const ai = inert;
export const links = inert;
export const storage = inert;
export const webAssets = inert;
export const exportDoc = inert;
export const clipboardIpc = inert;
