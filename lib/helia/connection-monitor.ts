'use client';

import { useState, useEffect } from 'react';
import { getHelia } from './singleton';

export interface ConnectionStatus {
  isReady: boolean;
  peerCount: number;
  connectionState: 'connecting' | 'connected' | 'degraded' | 'offline';
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  try {
    const helia = await getHelia();
    const peers = helia.libp2p.getPeers();
    const peerCount = peers.length;

    const getConnectionState = (count: number): ConnectionStatus['connectionState'] => {
      if (count >= 5) return 'connected';
      if (count >= 1) return 'degraded';
      return 'connecting';
    };

    const connectionState = getConnectionState(peerCount);

    return {
      isReady: peerCount >= 3,
      peerCount,
      connectionState,
    };
  } catch (err) {
    console.error('[ConnectionMonitor] Failed to get connection status:', err);
    return {
      isReady: false,
      peerCount: 0,
      connectionState: 'offline',
    };
  }
}

export function useConnectionStatus(pollInterval = 2000) {
  const [status, setStatus] = useState<ConnectionStatus>({
    isReady: false,
    peerCount: 0,
    connectionState: 'connecting',
  });

  useEffect(() => {
    const poll = async () => {
      try {
        const s = await getConnectionStatus();
        setStatus(s);
      } catch (err) {
        console.error('[ConnectionMonitor] Poll failed:', err);
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  return status;
}
