import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSecureClipboard } from '@/lib/security/clipboard';

describe('useSecureClipboard', () => {
  const mockClipboard = {
    writeText: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should copy text to clipboard', async () => {
    const { result } = renderHook(() => useSecureClipboard());

    await act(async () => {
      await result.current.copyToClipboard('secret data');
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith('secret data');
    expect(result.current.copied).toBe(true);
  });

  it('should auto-clear clipboard after delay', async () => {
    const { result } = renderHook(() => useSecureClipboard());

    await act(async () => {
      await result.current.copyToClipboard('secret data');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith('');
  });

  it('should reset copied state after delay', async () => {
    const { result } = renderHook(() => useSecureClipboard());

    await act(async () => {
      await result.current.copyToClipboard('secret data');
    });

    expect(result.current.copied).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.copied).toBe(false);
  });

  it('should use custom auto-clear delay', async () => {
    const { result } = renderHook(() =>
      useSecureClipboard({ autoClearDelayMs: 30000 })
    );

    await act(async () => {
      await result.current.copyToClipboard('secret data');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith('');
  });

  it('should throw error if clipboard API unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useSecureClipboard());

    await expect(
      result.current.copyToClipboard('secret data')
    ).rejects.toThrow('Clipboard API not available');
  });
});
