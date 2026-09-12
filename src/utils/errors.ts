import axios from 'axios';

/**
 * Extracts a human-readable error message from backend error responses
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) {
      // 1. Check for validation field errors { errors: { field: ["message"] } }
      if (data.errors && typeof data.errors === 'object') {
        const fields = Object.keys(data.errors);
        for (const field of fields) {
          const fieldErrors = data.errors[field];
          if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
            return fieldErrors[0];
          }
        }
      }

      // 2. Check for "error" key
      if (data.error && typeof data.error === 'string') {
        return data.error;
      }

      // 3. Check for "message" key
      if (data.message && typeof data.message === 'string') {
        return data.message;
      }
    }

    // 4. Check for network / timeout issues
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Unable to reach the server. Please ensure the backend is running.';
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

/**
 * Parses cooldown / wait seconds from a 429 rate limit response
 * e.g., "Please wait 42s before requesting another OTP" -> 42
 */
export function getRateLimitSeconds(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    const message = error.response.data?.message || error.response.data?.error || '';
    const match = message.match(/(\d+)\s*s/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    // Default cooldown if status is 429 but message doesn't match
    return 60;
  }
  return null;
}
