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
});
