export { registerPushSubscription, unregisterPushSubscription } from './api/web-push-api';
export { urlBase64ToUint8Array } from './utils/vapid';
export type {
  WebPushSubscriptionKeys,
  WebPushSubscriptionRegisterRequest,
  WebPushSubscriptionRemoveRequest,
} from './types/index';
