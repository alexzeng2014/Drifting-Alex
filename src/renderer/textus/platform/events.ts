/** Window-scoped events; the vendored editor only listens, never emits. */
export async function listenToThisWindow<T>(
  name: string,
  handler: (event: T) => void,
): Promise<() => void> {
  const listener = (event: Event) => handler((event as CustomEvent<T>).detail);
  window.addEventListener(`textus:${name}`, listener);
  return () => window.removeEventListener(`textus:${name}`, listener);
}
