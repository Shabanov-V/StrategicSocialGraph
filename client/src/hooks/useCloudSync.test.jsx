// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCloudSync } from './useCloudSync.jsx';

function setOnline(value) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('useCloudSync offline detection', () => {
  beforeEach(() => {
    setOnline(true);
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets status to offline when an offline event fires', () => {
    const { result } = renderHook(() => useCloudSync({ id: 'u1' }, 'a: 1'));
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.syncStatus).toBe('offline');
  });

  it('sets syncStatus to offline when save fails while device is offline', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    setOnline(false);

    const { result, rerender } = renderHook(
      ({ yamlText }) => useCloudSync({ id: 'u1' }, yamlText),
      { initialProps: { yamlText: 'a: 1' } }
    );

    // Arm the debounce effect
    await act(async () => {
      result.current.markSyncReady();
    });

    // Change yamlText to trigger a fresh debounce timer
    rerender({ yamlText: 'a: 2' });

    // Advance past the 2500ms debounce and flush pending promises
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    expect(result.current.syncStatus).toBe('offline');
    vi.useRealTimers();
  });
});

describe('useCloudSync reconnect auto-resync', () => {
  beforeEach(() => {
    setOnline(true);
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('flushes a pending save when the browser comes back online', async () => {
    const { result } = renderHook(() => useCloudSync({ id: 'u1' }, 'a: 1'));
    act(() => { result.current.markSyncReady(); });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/graph',
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(result.current.syncStatus).toBe('saved');
  });

  it('does not flush when there is no logged-in user', async () => {
    const { result } = renderHook(() => useCloudSync(null, 'a: 1'));
    act(() => { result.current.markSyncReady(); });

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('cancels pending debounce on reconnect flush so save fires exactly once', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    setOnline(true);

    const { result, rerender } = renderHook(
      ({ yamlText }) => useCloudSync({ id: 'u1' }, yamlText),
      { initialProps: { yamlText: 'a: 1' } }
    );

    // Mark ready so the debounce effect is armed
    await act(async () => {
      result.current.markSyncReady();
    });

    // Change yamlText to start a debounce timer (2500ms)
    rerender({ yamlText: 'a: 2' });

    // Before the debounce fires, the browser comes back online — triggers immediate flush
    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
    });

    // Advance past the debounce window; the cancelled timer must not fire again
    await vi.advanceTimersByTimeAsync(3000);

    // Only one PUT should have been made (the online flush, not a duplicate debounce)
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
