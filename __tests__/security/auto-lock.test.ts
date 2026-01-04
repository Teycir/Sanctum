import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoLock } from '@/lib/security/auto-lock';

describe('useAutoLock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should call onLock after default timeout (5 minutes)', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock));

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('should call onLock after custom timeout', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock, { timeoutMs: 10000 }));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onLock).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on mousedown', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock));

    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000);
      window.dispatchEvent(new MouseEvent('mousedown'));
      vi.advanceTimersByTime(4 * 60 * 1000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });

  it('should reset timer on keydown', () => {
    const onLock = vi.fn();
    renderHook(() => useAutoLock(onLock));

    act(() => {
      vi.advanceTimersByTime(4 * 60 * 1000);
      window.dispatchEvent(new KeyboardEvent('keydown'));
      vi.advanceTimersByTime(4 * 60 * 1000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const onLock = vi.fn();
    const { unmount } = renderHook(() => useAutoLock(onLock));

    unmount();

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(onLock).not.toHaveBeenCalled();
  });
});
