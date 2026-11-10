/** Textus's AI master switch. Drifting-Alex mounts the editor without Textus
 *  AI, so every AI path the editor could take stays closed. */
export function gateAiRequests(_isOn: () => boolean): void {
  // Nothing to gate: no Textus AI request is ever made from the editor.
}
