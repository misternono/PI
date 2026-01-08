// API Service for backend communication
const API_BASE_URL = 'https://localhost:7086';

/**
 * Generic API call wrapper with error handling
 * @param {string} endpoint - The API endpoint to call
 * @param {RequestInit} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<{data: any, error: any}>}
 */
async function apiCall(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers: defaultHeaders
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          status: response.status,
          statusText: response.statusText,
          message: data?.message || data || 'Request failed'
        }
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.message || 'Network error',
        type: 'network_error',
        original: error
      }
    };
  }
}

/**
 * GET request
 * @param {string} endpoint
 * @param {RequestInit} options
 */
export async function get(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 * @param {string} endpoint
 * @param {any} body
 * @param {RequestInit} options
 */
export async function post(endpoint, body, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * PUT request
 * @param {string} endpoint
 * @param {any} body
 * @param {RequestInit} options
 */
export async function put(endpoint, body, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

/**
 * DELETE request
 * @param {string} endpoint
 * @param {RequestInit} options
 */
export async function del(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: 'DELETE' });
}

/**
 * PATCH request
 * @param {string} endpoint
 * @param {any} body
 * @param {RequestInit} options
 */
export async function patch(endpoint, body, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

// Export the base URL for reference
export const baseUrl = API_BASE_URL;

// Export default object with all methods
export default {
  get,
  post,
  put,
  delete: del,
  patch,
  baseUrl
};
