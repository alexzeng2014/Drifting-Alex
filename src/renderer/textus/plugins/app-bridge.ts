/** Where a document sits, as Textus's plugin bridge described it. The vendored
 *  editor only needs the type for tab jumps. */
export interface DocumentPlace {
  line: number;
  column: number;
}

export interface PluginTabInfo {
  id: string;
  title: string;
  kind: 'document' | 'file' | 'view' | 'web';
  path: string | null;
  plugin?: string;
}
