'use client';

import { useState, useEffect } from 'react';
import { SecureVaultRelay, isP2PTAvailable, hashTopic } from '@/lib/p2pt';

export default function P2PTValidationPage() {
  const [status, setStatus] = useState('');
  const [cid, setCid] = useState('');
  const [relay, setRelay] = useState<SecureVaultRelay | null>(null);
  const [available, setAvailable] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAvailable(isP2PTAvailable());
    setMounted(true);
  }, []);

  const startHost = async () => {
    console.log('[P2PT] Starting host...');
    try {
      const testCID = 'test-' + Date.now();
      const testData = new TextEncoder().encode('Hello from P2PT!');
      
      setStatus('🔵 Starting host...');
      console.log('[P2PT] Creating relay...');
      const newRelay = new SecureVaultRelay();
      
      console.log('[P2PT] Hosting vault with CID:', testCID);
      await newRelay.hostVault(testCID, testData);
      
      setRelay(newRelay);
      setCid(testCID);
      const successMsg = `✅ Hosting vault\nCID: ${testCID}\nTopic: ${hashTopic(testCID)}\n\nOpen another tab and fetch this CID`;
      setStatus(successMsg);
      console.log('[P2PT] Host started successfully:', testCID);
    } catch (error) {
      console.error('[P2PT] Host error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const fetchVault = async () => {
    if (!cid) {
      setStatus('❌ Enter CID first');
      return;
    }

    console.log('[P2PT] Fetching vault with CID:', cid);
    try {
      setStatus('🔵 Fetching from peer...');
      const fetchRelay = new SecureVaultRelay({ timeoutMs: 15000 });
      console.log('[P2PT] Waiting for peer connection...');
      const data = await fetchRelay.fetchVault(cid);
      
      if (data) {
        const text = new TextDecoder().decode(data);
        console.log('[P2PT] Retrieved data:', text);
        setStatus(`✅ Retrieved via P2PT!\nData: ${text}`);
      } else {
        console.log('[P2PT] No peer found (timeout)');
        setStatus('⚠️ No peer found (timeout)');
      }
      
      fetchRelay.cleanup();
    } catch (error) {
      console.error('[P2PT] Fetch error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const cleanup = () => {
    relay?.cleanup();
    setRelay(null);
    setStatus('🧹 Cleaned up');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">P2PT Validation</h1>
        
        {!mounted ? (
          <div className="bg-gray-800 p-4 rounded mb-4">
            <p>Loading...</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 p-4 rounded mb-4">
              <p className="mb-2">
                <strong>WebRTC Available:</strong> {available ? '✅ Yes' : '❌ No'}
              </p>
              <p className="text-sm text-gray-400">
                P2PT requires WebRTC support. If unavailable, vault retrieval will fallback to Helia.
              </p>
            </div>

            {!available && (
              <div className="bg-yellow-900 p-4 rounded mb-4">
                <p className="text-yellow-200">
                  ⚠️ WebRTC not available. P2PT will not work in this environment.
                </p>
              </div>
            )}

            <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Step 1: Host Vault</h2>
            <button
              onClick={startHost}
              disabled={!available || !!relay}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Start Hosting
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Step 2: Fetch Vault</h2>
            <input
              type="text"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="Enter CID from host"
              className="bg-gray-700 px-4 py-2 rounded w-full mb-2"
            />
            <button
              onClick={fetchVault}
              disabled={!available || !cid}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Fetch from Peer
            </button>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Cleanup</h2>
            <button
              onClick={cleanup}
              disabled={!relay}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded"
            >
              Stop Hosting
            </button>
          </div>
            </div>

            <div className="mt-6 bg-gray-800 p-4 rounded">
              <h3 className="font-semibold mb-2">Status:</h3>
              <pre className="text-sm whitespace-pre-wrap">{status || 'Ready'}</pre>
            </div>

            <div className="mt-6 bg-gray-800 p-4 rounded text-sm">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click "Start Hosting" in this tab</li>
                <li>Copy the CID shown in status</li>
                <li>Open this page in another tab/window</li>
                <li>Paste CID and click "Fetch from Peer"</li>
                <li>Verify data transfers successfully</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
