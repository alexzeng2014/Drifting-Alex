/** iOS security-scoped URLs; desktop builds never produce them. */
export function isScopedUrl(path: string): boolean {
  return path.startsWith('file-scoped:');
}

export async function scopedImageSrc(src: string, _doc: string): Promise<string> {
  return src;
}
