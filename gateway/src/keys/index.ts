// gateway/src/keys/index.ts
// Barrel export for the two-key architecture module.
export { encryptKey, decryptKey } from './key-encryption';
export { validateKey, detectProvider } from './key-validator';
export type { ValidationResult } from './key-validator';
export {
  getActiveKey,
  handleSetKey,
  handlePrimaryKeyError,
  createInitialKeyConfig,
  checkTrialReminder,
  isTrialExpired
} from './key-manager';
export type { KeyConfig, CustomerState } from './key-manager';
export { callLLM } from './call-llm';
