import { createHelia, type Helia } from 'helia';
import { createBrowserLibp2pConfig } from './config';
import { cachePeer } from './peer-cache';

let heliaInstance: Helia | undefined;
let initPromise: Promise<Helia> | undefined;

export function warmUpHelia(): void {
  initPromise ??= createBrowserLibp2pConfig()
      .then((config) => createHelia({ libp2p: config }))
      .then((helia) => {
        heliaInstance = helia;
        if (process.env.NODE_ENV === 'development') {
          console.log('[Helia] Warmed up, peer ID:', helia.libp2p.peerId.toString());
        }

        // Cache successful peers
        helia.libp2p.addEventListener('peer:connect', (evt) => {
          const peer = evt.detail;
          helia.libp2p.peerStore.get(peer).then((peerInfo) => {
            peerInfo.addresses.forEach((addr) => {
              cachePeer(addr.multiaddr.toString()).catch((err) => {
                console.error('[Helia] Failed to cache peer:', err);
              });
            });
          }).catch((err) => {
            console.error('[Helia] Failed to get peer info:', err);
          });
        });

        return helia;
      })
      .catch((err) => {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[Helia] Warm-up failed:', errorMessage);
        initPromise = undefined;
        throw err;
      });
}

export async function getHelia(): Promise<Helia> {
  if (heliaInstance) return heliaInstance;
  if (initPromise) return initPromise;
  warmUpHelia();
  if (!initPromise) throw new Error('Failed to initialize Helia');
  return initPromise;
}

export async function stopHelia(): Promise<void> {
  if (heliaInstance) {
    try {
      await heliaInstance.stop();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Helia] Failed to stop:', errorMessage);
    } finally {
      heliaInstance = undefined;
      initPromise = undefined;
    }
  }
}
