const BASE_URL = '/api';

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function registerUser({ username, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return handleResponse(res);
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function getProfile(token) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    }
  });
  return handleResponse(res);
}

export async function getLeaderboard(limit = 20) {
  const res = await fetch(`${BASE_URL}/stats/leaderboard?limit=${limit}`);
  return handleResponse(res);
}

export async function getMatchHistory(token, page = 1) {
  const res = await fetch(`${BASE_URL}/stats/matches?page=${page}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    }
  });
  return handleResponse(res);
}

export async function getProfileStats(token) {
  const res = await fetch(`${BASE_URL}/stats/profile`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token)
    }
  });
  return handleResponse(res);
}
