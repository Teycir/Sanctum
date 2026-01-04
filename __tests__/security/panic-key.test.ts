import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanicKey } from '@/lib/security/panic-key';

describe('usePanicKey', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should trigger on double Escape press', () => {
    const onPanic = vi.fn();
    renderHook(() => usePanicKey(onPanic));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      vi.advanceTimersByTime(300);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onPanic).toHaveBeenCalledTimes(1);
  });

  it('should not trigger on single press', () => {
    const onPanic = vi.fn();
    renderHook(() => usePanicKey(onPanic));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      vi.advanceTimersByTime(600);
    });

    expect(onPanic).not.toHaveBeenCalled();
  });

  it('should not trigger if delay exceeded', () => {
    const onPanic = vi.fn();
    renderHook(() => usePanicKey(onPanic));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      vi.advanceTimersByTime(600);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onPanic).not.toHaveBeenCalled();
  });

  it('should work with custom key', () => {
    const onPanic = vi.fn();
    renderHook(() => usePanicKey(onPanic, { key: 'l' }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
      vi.advanceTimersByTime(300);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    });

    expect(onPanic).toHaveBeenCalledTimes(1);
  });

  it('should require Ctrl when configured', () => {
    const onPanic = vi.fn();
    renderHook(() => usePanicKey(onPanic, { key: 'l', requireCtrl: true }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true }));
      vi.advanceTimersByTime(300);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true }));
    });

    expect(onPanic).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const onPanic = vi.fn();
    const { unmount } = renderHook(() => usePanicKey(onPanic));

    unmount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      vi.advanceTimersByTime(300);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onPanic).not.toHaveBeenCalled();
  });
});
