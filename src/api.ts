import type { Credentials, ProfileData, UserProfile } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://inai-col2.fishrungames.com'
const SESSION_KEY = 'band-members-session-id'

let sessionId = localStorage.getItem(SESSION_KEY)

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object') {
    return Object.values(data as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(String)
      .join(' ')
  }
  return fallback
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (sessionId) headers.set('Session-Id', sessionId)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const receivedSession = response.headers.get('Session-Id')
  if (receivedSession) {
    sessionId = receivedSession
    localStorage.setItem(SESSION_KEY, receivedSession)
  }

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) throw new Error(getErrorMessage(data, 'Не удалось выполнить запрос.'))
  return data as T
}

export const api = {
  register: (credentials: Credentials) =>
    request<UserProfile>('/api/register/', { method: 'POST', body: JSON.stringify(credentials) }),
  login: (credentials: Credentials) =>
    request<UserProfile>('/api/login/', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => request<UserProfile>('/api/profile/'),
  updateProfile: (profile: ProfileData) =>
    request<UserProfile>('/api/profile/', { method: 'PATCH', body: JSON.stringify(profile) }),
  async logout() {
    await request('/api/logout/', { method: 'POST' })
    sessionId = null
    localStorage.removeItem(SESSION_KEY)
  },
}

