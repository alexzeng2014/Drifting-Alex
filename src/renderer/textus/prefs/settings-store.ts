/**
 * The vendored editor's few reads of the last-saved settings. Drifting-Alex
 * has one editor configuration, so these answer from the bundle defaults.
 */
import { DEFAULT_SETTINGS, type Settings } from './settings-types';

export function loadSettings(): Settings {
  return DEFAULT_SETTINGS;
}
