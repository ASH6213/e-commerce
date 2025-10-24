import type PusherType from 'pusher-js';

/**
 * Returns a Pusher client configured for either:
 * - Pusher Cloud (NEXT_PUBLIC_PUSHER_KEY/CLUSTER)
 * - Laravel Reverb (NEXT_PUBLIC_REVERB_* envs)
 */
export async function getPusher(): Promise<PusherType | null> {
  if (typeof window === 'undefined') return null;
  const { default: Pusher } = await import('pusher-js');

  // Prefer explicit Pusher Cloud config
  const cloudKey = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
  if (cloudKey) {
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';
    const client = new Pusher(cloudKey, {
      cluster,
      forceTLS: true,
    });
    return client as unknown as PusherType;
  }

  // Fallback to Reverb (self-hosted, Pusher-compatible)
  const reverbKey = process.env.NEXT_PUBLIC_REVERB_APP_KEY || process.env.NEXT_PUBLIC_REVERB_KEY || '';
  if (reverbKey) {
    const useProxy = process.env.NEXT_PUBLIC_REVERB_PROXY === '1';
    if (useProxy && typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:';
      const client = new Pusher(reverbKey, {
        wsHost: window.location.hostname,
        wsPort: Number(window.location.port || (isHttps ? 443 : 80)),
        wssPort: Number(window.location.port || 443),
        forceTLS: isHttps,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        cluster: 'mt1',
      } as any);
      return client as unknown as PusherType;
    }

    const reverbHost = process.env.NEXT_PUBLIC_REVERB_HOST || '127.0.0.1';
    const reverbPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080);
    const reverbScheme = (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http').toLowerCase();
    const client = new Pusher(reverbKey, {
      wsHost: reverbHost,
      wsPort: reverbPort,
      wssPort: reverbPort,
      forceTLS: reverbScheme === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      cluster: 'mt1',
    } as any);
    return client as unknown as PusherType;
  }

  return null;
}
