/**
 * Real-time Hooks - Barrel Export
 * 
 * Import all real-time hooks from a single location:
 * 
 * @example
 * import { useRealtimeProducts, useRealtimeOrders } from '@/lib/hooks';
 */

export { useRealtimeProducts } from './useRealtimeProducts';
export { useRealtimeOrders } from './useRealtimeOrders';

export type { Product } from './useRealtimeProducts';
export type { Order } from './useRealtimeOrders';
