/** Platform facts the vendored editor reads; Drifting runs on Windows, macOS
 *  and Linux, so these answer from the user agent. */
const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;

export function isMacPlatform(): boolean {
  return /Mac|iPhone|iPad/i.test(ua);
}

export function isLinuxPlatform(): boolean {
  return /Linux/i.test(ua) && !/Android/i.test(ua);
}

/** Whether the platform's primary modifier is Cmd rather than Ctrl. */
export function modIsMeta(): boolean {
  return isMacPlatform();
}
