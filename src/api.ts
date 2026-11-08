import type { Credentials, ProfileData, UserProfile, Specialization } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? 'https://inai-col3.fishrungames.com').replace(/\/$/, '')
const LOGGED_OUT_KEY = 'band-members-logged-out'
let accessToken: string | null = null
let refreshInProgress: Promise<void> | null = null
localStorage.removeItem('band-members-access-token')
localStorage.removeItem('band-members-refresh-token')
localStorage.removeItem('band-members-session-id')

export class AuthRequiredError extends Error {
  constructor() {
    super('Сессия завершилась. Войдите снова.')
    this.name = 'AuthRequiredError'
  }
}

async function send<T>(path: string, options: RequestInit = {}, authenticated = false): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (authenticated && accessToken && path !== '/api/token/refresh/') headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' })
  if (response.status === 401 && authenticated) throw new AuthRequiredError()
  const text = await response.text()
  let data: unknown
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!response.ok) {
    const details = data && typeof data === 'object'
      ? Object.values(data).flat().map(String).join(' ')
      : ''
    throw new Error(response.status >= 500
      ? `Сервер временно недоступен (HTTP ${response.status}). Попробуйте позже.`
      : details || `Не удалось выполнить запрос (HTTP ${response.status}).`)
  }
  return data as T
}

function acceptAccess(result: { access: string }) {
  if (!result || typeof result.access !== 'string' || !result.access) {
    throw new Error('Сервер не вернул access token.')
  }
  accessToken = result.access
}

async function refreshAccess() {
  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      try {
        acceptAccess(await send<{ access: string }>('/api/token/refresh/', { method: 'POST' }, true))
      } catch (error) {
        if (error instanceof AuthRequiredError) accessToken = null
        throw error
      } finally {
        refreshInProgress = null
      }
    })()
  }
  await refreshInProgress
}

async function protectedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (localStorage.getItem(LOGGED_OUT_KEY)) throw new AuthRequiredError()
  if (!accessToken) await refreshAccess()
  const sentToken = accessToken
  try {
    return await send<T>(path, options, true)
  } catch (error) {
    if (!(error instanceof AuthRequiredError)) throw error
    if (accessToken === sentToken) await refreshAccess()
    try {
      return await send<T>(path, options, true)
    } catch (retryError) {
      if (retryError instanceof AuthRequiredError) accessToken = null
      throw retryError
    }
  }
}

async function authenticate(path: string, credentials: Credentials) {
  const result = await send<{ access: string; user?: UserProfile }>(path, {
    method: 'POST', body: JSON.stringify(credentials),
  })
  acceptAccess(result)
  localStorage.removeItem(LOGGED_OUT_KEY)
  return result.user ?? protectedRequest<UserProfile>('/api/profile/')
}

export const api = {
  getSpecializations: () => send<Array<{ value: Specialization; label: string }>>('/api/specializations/'),
  register: (credentials: Credentials) => authenticate('/api/register/', credentials),
  login: (credentials: Credentials) => authenticate('/api/login/', credentials),
  getProfile: () => protectedRequest<UserProfile>('/api/profile/'),
  updateProfile: (profile: ProfileData) => protectedRequest<UserProfile>('/api/profile/', {
    method: 'PATCH', body: JSON.stringify({ first_name: profile.first_name, specialization: profile.specialization, bio: profile.bio, ...(profile.fee === '' ? {} : { fee: profile.fee }) }),
  }),
  async logout() {
    localStorage.setItem(LOGGED_OUT_KEY, 'true')
    accessToken = null
    if (refreshInProgress) await refreshInProgress.catch(() => undefined)
    accessToken = null
    try {
      await send('/api/logout/', { method: 'POST' })
    } catch (error) {
      throw new Error('Вы вышли на этом устройстве, но сервер не подтвердил завершение сессии. ' + (error instanceof Error ? error.message : 'Ошибка сети.'))
    }
  },
}

