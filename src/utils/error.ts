export interface ExtractedErrorDetails {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number | string;
}

export function extractErrorDetails(error: unknown): ExtractedErrorDetails {
  const fieldErrors: Record<string, string> = {};

  if (!error) {
    return { message: 'An unexpected error occurred.', fieldErrors };
  }

  // Handle plain string errors
  if (typeof error === 'string') {
    const clean = error.includes('expected string, received undefined')
      ? 'A required field was not provided.'
      : error;
    return { message: clean, fieldErrors };
  }

  // Handle JS Error instances
  if (error instanceof Error) {
    return { message: error.message || 'An unexpected error occurred.', fieldErrors };
  }

  const errObj = error as Record<string, unknown>;

  // Handle RTK Query FetchBaseQueryError network/timeout status
  if (errObj.status === 'FETCH_ERROR') {
    return {
      message: 'Unable to connect to the server. Please check your network connection.',
      fieldErrors,
      status: 'FETCH_ERROR',
    };
  }

  if (errObj.status === 'TIMEOUT_ERROR') {
    return {
      message: 'The server request timed out. Please try again.',
      fieldErrors,
      status: 'TIMEOUT_ERROR',
    };
  }

  // Handle standard RTK Query / Axios error data
  const data = errObj.data ?? errObj.response;

  // If data is a plain string (e.g. server HTML error 502/504)
  if (typeof data === 'string') {
    const cleanStr = data.length < 200 ? data : 'The server returned an unexpected error response.';
    return { message: cleanStr, fieldErrors, status: errObj.status as number | undefined };
  }

  // Extract from data object if available
  const payload = (typeof data === 'object' && data !== null) ? (data as Record<string, unknown>) : errObj;

  // Unwrap envelope errors object: { success, message, errors: { ... } }
  const rawErrors = (payload.errors && typeof payload.errors === 'object' && payload.errors !== null)
    ? (payload.errors as Record<string, unknown>)
    : payload;

  const messages: string[] = [];

  // 1. Process detail / non_field_errors
  for (const detailKey of ['detail', 'non_field_errors', 'error']) {
    if (detailKey in rawErrors) {
      const val = rawErrors[detailKey];
      let text = '';
      if (typeof val === 'string') {
        text = val;
      } else if (Array.isArray(val) && val.length > 0) {
        text = val.map((v) => String(v)).join(' ');
      }
      if (text) {
        messages.push(text);
      }
    }
  }

  // 2. Process field-specific errors
  for (const [key, val] of Object.entries(rawErrors)) {
    if (['detail', 'non_field_errors', 'error', 'success', 'message', 'errors', 'status'].includes(key)) {
      continue;
    }
    let text = '';
    if (typeof val === 'string') {
      text = val;
    } else if (Array.isArray(val) && val.length > 0) {
      text = val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' ');
    } else if (val && typeof val === 'object') {
      text = JSON.stringify(val);
    }

    if (text) {
      if (text.includes('expected string, received undefined') || text.includes('expected string, received null')) {
        text = 'This field is required';
      }
      fieldErrors[key] = text;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      messages.push(`${label}: ${text}`);
    }
  }

  if (messages.length > 0) {
    return {
      message: messages.join(' | '),
      fieldErrors,
      status: errObj.status as number | undefined,
    };
  }

  // Fallback to top-level message if meaningful
  if (typeof payload.message === 'string' && payload.message && payload.message !== 'Validation error' && payload.message !== 'Request failed') {
    return {
      message: payload.message,
      fieldErrors,
      status: errObj.status as number | undefined,
    };
  }

  // HTTP Status based fallbacks
  const statusCode = typeof errObj.status === 'number' ? errObj.status : undefined;
  if (statusCode === 401) {
    return { message: 'Authentication required. Please sign in again.', fieldErrors, status: 401 };
  }
  if (statusCode === 403) {
    return { message: 'You do not have permission to perform this action.', fieldErrors, status: 403 };
  }
  if (statusCode === 404) {
    return { message: 'The requested resource was not found.', fieldErrors, status: 404 };
  }
  if (statusCode === 409) {
    return { message: 'A conflict occurred with existing data.', fieldErrors, status: 409 };
  }
  if (statusCode && statusCode >= 500) {
    return { message: 'Server error. Please try again later.', fieldErrors, status: statusCode };
  }

  return { message: 'An unexpected error occurred.', fieldErrors };
}

export function extractMessage(error: unknown): string {
  return extractErrorDetails(error).message;
}
