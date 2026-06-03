export { useCognitoInit } from './hooks/use-cognito-init';
export type { CognitoCoreResult } from './hooks/use-cognito-init';

// PKCE / authorization-transaction helpers — for completing the Hosted-UI
// callback (validate `state`, read the `code_verifier`, then clear).
export {
  readCognitoAuthTransaction,
  clearCognitoAuthTransaction,
  buildCognitoAuthorizeUrl,
  generatePkce,
  randomToken,
  COGNITO_AUTH_TX_KEY,
} from './pkce';
export type { CognitoAuthTransaction, PkcePair } from './pkce';
