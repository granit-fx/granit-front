import {
  OPEN_COMMAND_PALETTE_EVENT,
  openCommandPalette,
} from '../command-palette-events';

describe('openCommandPalette', () => {
  it('dispatches the open-command-palette custom event', () => {
    const listener = vi.fn();
    globalThis.addEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);
    openCommandPalette();
    globalThis.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
  });
});
