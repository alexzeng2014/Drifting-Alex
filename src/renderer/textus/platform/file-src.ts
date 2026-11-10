/** A local file path as something an `<img>` can load. Drifting serves assets
 *  through its own protocol, so a path is returned unchanged when no scheme is
 *  present; the image simply does not resolve. */
export function fileSrc(path: string): string {
  return path;
}
