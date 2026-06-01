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
} from './types/index';

// API — user presence
export {
  clearMyPresenceOverride,
  getBatchPresence,
  getMyPresence,
  getUserPresence,
  pollMyPresence,
  setMyPresence,
} from './api/presence-api';

// API — resource rooms
export { getResourceRoom, joinResourceRoom, leaveResourceRoom } from './api/presence-rooms-api';

// Permissions
export { PresencePermissions } from './permissions';

// Defaults
export { PRESENCE_DEFAULTS } from './constants';
