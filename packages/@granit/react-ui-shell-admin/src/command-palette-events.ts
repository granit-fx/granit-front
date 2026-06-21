export const OPEN_COMMAND_PALETTE_EVENT = 'granit:open-command-palette';

export function openCommandPalette(): void {
  globalThis.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
}
