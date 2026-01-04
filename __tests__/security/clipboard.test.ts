import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSecureClipboard } from '@/lib/security/clipboard';

describe('useSecureClipboard', () => {
  const mockClipboard = {
    writeText: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, { clipboard: mockClipboard });
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

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });
  });

  it('should reset copied state after delay', async () => {
    const { result } = renderHook(() => useSecureClipboard());

    await act(async () => {
      await result.current.copyToClipboard('secret data');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(result.current.copied).toBe(false);
    });
  });

  it('should use custom auto-clear delay', async () => {
    const { result } = renderHook(() =>
      useSecureClipboard({ autoClearDelayMs: 30000 })
    );

    await act(async () => {
      await result.current.copyToClipboard('secret data');
    });

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });
  });

  it('should throw error if clipboard API unavailable', async () => {
    Object.assign(navigator, { clipboard: undefined });
    const { result } = renderHook(() => useSecureClipboard());

    await expect(
      result.current.copyToClipboard('secret data')
    ).rejects.toThrow('Clipboard API not available');
  });
});
