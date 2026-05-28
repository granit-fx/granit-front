// Types
export type {
  BatchPresenceRequest,
  BatchPresenceResponse,
  HeartbeatRequest,
  ManualPresenceStatus,
  PresenceResponse,
  PresenceStatus,
  ResourcePresenceParticipantResponse,
  ResourceRoomResponse,
  SetPresenceRequest,
} from './types/index.js';

// API — user presence
export {
  clearMyPresenceOverride,
  getBatchPresence,
  getMyPresence,
  getUserPresence,
  pollMyPresence,
  setMyPresence,
} from './api/presence-api.js';

// API — resource rooms
export { getResourceRoom, joinResourceRoom, leaveResourceRoom } from './api/presence-rooms-api.js';

// Permissions
export { PresencePermissions } from './permissions.js';

// Defaults
export { PRESENCE_DEFAULTS } from './constants.js';
