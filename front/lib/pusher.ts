import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher instance
 * Singleton pattern to ensure only one connection
 */
export const getPusher = (): Pusher | null => {
  // Check if Pusher credentials are configured
  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;

  if (!appKey || !cluster || appKey === 'your-app-key') {
    console.warn('Pusher not configured. Real-time updates are disabled.');
    return null;
  }

  // Return existing instance if available
  if (pusherInstance) {
    return pusherInstance;
  }

  // Create new Pusher instance
  try {
    pusherInstance = new Pusher(appKey, {
      cluster: cluster,
      forceTLS: true,
    });

    pusherInstance.connection.bind('connected', () => {
      console.log('Pusher connected successfully');
    });

    pusherInstance.connection.bind('error', (err: any) => {
      console.error('Pusher connection error:', err);
    });

    return pusherInstance;
  } catch (error) {
    console.error('Failed to initialize Pusher:', error);
    return null;
  }
};

/**
 * Disconnect Pusher instance
 */
export const disconnectPusher = (): void => {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
    console.log('Pusher disconnected');
  }
};
