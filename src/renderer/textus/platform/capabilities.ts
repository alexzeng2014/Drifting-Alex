/**
 * What this build can do. Drifting-Alex is the desktop app and mounts the
 * Textus editor without Textus's app chrome, so the desktop flags are on and
 * the iOS/Textus-AI ones are off.
 */
export const isDesktopApp = true;
export const isIOSApp = false;

export const canUseWindows = true;
export const hasAppMenu = true;
export const canPickImageFile = true;
export const canRevealInFileManager = true;
export const canPickFolder = true;
export const canTrashFiles = true;

/** Textus AI is not part of this product; Drifting's Agent is. */
export const hasTextusAi = false;
