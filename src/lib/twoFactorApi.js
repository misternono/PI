import { post } from './apiService';

/**
 * Initiate 2FA setup
 * @param {string} email - User email
 * @returns {Promise<{data: {secret, totpUrl, manualEntryKey}, error}>}
 */
export async function initiateTwoFactorSetup(email) {
  try {
    const { data, error } = await post('/api/Auth/two-factor/setup/initiate', {
      email
    });

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        secret: data.secret,
        totpUrl: data.totpUrl,
        manualEntryKey: data.manualEntryKey
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || 'Failed to initiate 2FA setup' }
    };
  }
}

/**
 * Verify 2FA code and complete setup or login
 * @param {string} email - User email
 * @param {string} code - 6-digit TOTP code
 * @returns {Promise<{data: {token, user}, error}>}
 */
export async function verifyTwoFactorCode(email, code) {
  try {
    const { data, error } = await post('/api/Auth/two-factor/setup/verify', {
      email,
      code
    });

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        token: data.token,
        user: data.user
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: error.message || 'Failed to verify 2FA code' }
    };
  }
}
