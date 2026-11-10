/**
 * The folder of the window's document, used to resolve relative links and
 * images. Drifting chapters have no file path in the editor, so this is the
 * empty folder and every relative reference stays unresolved.
 */
export function windowFolder(): string {
  return '';
}
