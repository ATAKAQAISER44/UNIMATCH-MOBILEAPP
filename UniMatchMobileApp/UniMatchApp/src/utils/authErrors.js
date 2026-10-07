// Kept for older imports; the shared mapper lives in authValidation.js.
import { friendlyAuthError } from './authValidation';

export { friendlyAuthError };

export const getFriendlyAuthError = (message = '') => friendlyAuthError(message);
