/**
 * The settings shape the vendored editor reads, without Textus's settings
 * store. Drifting-Alex supplies one frozen object per editor mount; the
 * editor's plugin chain takes it through a ref and re-reads it live.
 */
import {
  DEFAULT_SETTINGS,
  type Settings,
} from './settings-types';

export type {
  Settings,
  DiagramEngine,
  ImageNamingMode,
  ColorSwatchMode,
} from './settings-types';
export { DEFAULT_SETTINGS } from './settings-types';

/** The editor's read-only view: the defaults, overridden by the caller. */
export function editorSettings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}
