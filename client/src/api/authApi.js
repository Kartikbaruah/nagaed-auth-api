const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const message = body?.error?.message || 'Something went wrong. Please try again.';
    const code = body?.error?.code || 'UNKNOWN_ERROR';
    throw new ApiError(message, code, res.status);
  }

  return body.data;
}

export function register({ username, email, password, address }) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, address }),
  });
}

export function login({ email, password }) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getProfile(userId, accessToken) {
  return request(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export { ApiError };
