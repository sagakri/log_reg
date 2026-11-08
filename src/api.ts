import type { Credentials, ProfileData, UserProfile } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://inai-col3.fishrungames.com').replace(/\/$/, '')
const ACCESS_TOKEN_KEY = 'band-members-access-token'
const REFRESH_TOKEN_KEY = 'band-members-refresh-token'

interface TokenPair {
  access: string
  refresh: string
}

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

async function readResponse<T>(response: Response): Promise<T> {
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

function saveTokens(tokens: Partial<TokenPair>) {
  if (tokens.access) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access)
  if (tokens.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh)
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

async function requestNewTokens(credentials: Credentials) {
  const tokens = await readResponse<TokenPair>(await fetch(`${API_URL}/api/token/`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }))
  if (!tokens?.access || !tokens?.refresh) throw new Error('Сервер не вернул пару JWT-токенов.')
  saveTokens(tokens)
}

let refreshInProgress: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refresh) return false

  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      try {
        const tokens = await readResponse<Partial<TokenPair>>(await fetch(`${API_URL}/api/token/refresh/`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        }))
        if (!tokens.access) return false
        saveTokens(tokens)
        return true
      } catch {
        return false
      } finally {
        refreshInProgress = null
      }
    })()
  }

  return refreshInProgress
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')

  const access = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (access) headers.set('Authorization', `Bearer ${access}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401 && retry && await refreshAccessToken()) {
    return request<T>(path, options, false)
  }
  if (response.status === 401 && access) clearTokens()
  return readResponse<T>(response)
}

export const api = {
  async register(credentials: Credentials) {
    await request<unknown>('/api/register/', { method: 'POST', body: JSON.stringify(credentials) })
    await requestNewTokens(credentials)
    return request<UserProfile>('/api/profile/')
  },
  async login(credentials: Credentials) {
    await requestNewTokens(credentials)
    return request<UserProfile>('/api/profile/')
  },
  getProfile: () => request<UserProfile>('/api/profile/'),
  updateProfile: (profile: ProfileData) =>
    request<UserProfile>('/api/profile/', { method: 'PATCH', body: JSON.stringify(profile) }),
  logout() {
    clearTokens()
  },
}
