import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { bootstrap } from '@libp2p/bootstrap';
import { identify } from '@libp2p/identify';
import type { Libp2pOptions } from 'libp2p';
import { getCachedPeers } from './peer-cache';

const BROWSER_BOOTSTRAP_NODES = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dns4/elastic.dag.house/tcp/443/wss/p2p/bafzbeibhqavlasjc7dvbiopygwncnrtvjd2xmryk5laib7zyjor6kf3avm',
];

export async function createBrowserLibp2pConfig(): Promise<Libp2pOptions> {
  const cachedPeers = await getCachedPeers();

  return {
    transports: [
      webSockets({
        filter: (addrs) =>
          addrs.filter(
            (a) =>
              a.toString().includes('/wss/') ||
              a.toString().includes('/tls/ws/')
          ),
      }),
      webRTC(),
      circuitRelayTransport(),
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
      bootstrap({
        list: [...cachedPeers, ...BROWSER_BOOTSTRAP_NODES],
      }),
    ],
    services: {
      identify: identify(),
    },
    connectionManager: {
      maxConnections: 20,
    },
  };
}
