export const API_VERSION = 'v1';
export const MODULE = 'identity';
export const DEFAULT_BASE_PATH = `/api/${API_VERSION}/${MODULE}/users`;
export const DEFAULT_PROVIDER_BASE_PATH = `/api/${API_VERSION}/${MODULE}/provider`;
// Self-service sessions/devices are canonical, transport-agnostic routes mounted
// at the API root (`/api/v1/sessions`, `/api/v1/devices`) — not under `/identity`.
export const DEFAULT_SESSIONS_BASE_PATH = `/api/${API_VERSION}`;
