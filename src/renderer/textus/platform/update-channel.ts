/** Which release line the updater follows. Drifting-Alex ships none, but the
 *  settings shape the vendored editor reads still names both. */
export type UpdateChannel = 'stable' | 'beta';
export const UPDATE_CHANNELS: readonly UpdateChannel[] = ['stable', 'beta'];
