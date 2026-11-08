import { FormEvent, useEffect, useState } from 'react'
import { api, AuthRequiredError } from './api'
import type { Credentials, ProfileData, Specialization, UserProfile } from './types'

const emptyProfile: ProfileData = { first_name: '', specialization: 'other', bio: '', fee: '' }

export default function App() {
  const [specializations, setSpecializations] = useState<Array<{ value: Specialization; label: string }>>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [credentials, setCredentials] = useState<Credentials>({ username: '', password: '' })
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [feeError, setFeeError] = useState('')

  useEffect(() => {
    api.getSpecializations().then(setSpecializations).catch((err) => {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить специализации.')
    })
    api.getProfile()
      .then(showProfile)
      .catch((err) => { if (!(err instanceof AuthRequiredError)) setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль.') })
      .finally(() => setLoading(false))
  }, [])

  function showProfile(currentUser: UserProfile) {
    setUser(currentUser)
    setProfile({ ...emptyProfile, ...currentUser.profile })
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const result = mode === 'login' ? await api.login(credentials) : await api.register(credentials)
      showProfile(result)
      setMessage(mode === 'login' ? 'Вы вошли в систему.' : 'Регистрация завершена.')
      setCredentials({ username: '', password: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти в систему.')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    const fee = (profile.fee ?? '').trim().replace(',', '.')
    const isFeeValid = fee === '' || /^-?\d{1,8}(\.\d{1,2})?$/.test(fee)

    if (!isFeeValid) {
      setFeeError('Введите сумму: до 8 цифр и не более 2 знаков после точки. Например: 5000.00')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')
    setFeeError('')
    try {
      showProfile(await api.updateProfile({ ...profile, fee }))
      setMessage('Профиль сохранён.')
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        setUser(null)
        setProfile(emptyProfile)
      }
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль.')
    } finally {
      setSubmitting(false)
    }
  }

  async function logout() {
    setSubmitting(true)
    setError('')
    try {
      await api.logout()
      setUser(null)
      setProfile(emptyProfile)
      setMessage('Вы вышли из системы.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выйти из системы.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <main className="page"><p>Загрузка...</p></main>

  return (
    <main className="page">
      <section className="card">
        <header className="header">
          <div>
            <h1>Band Members</h1>
            <p>Личный кабинет музыканта</p>
          </div>
          {user && <button className="secondary" onClick={logout} disabled={submitting}>Выйти</button>}
        </header>

        {message && <p className="notice success">{message}</p>}
        {error && <p className="notice error">{error}</p>}

        {!user ? (
          <form onSubmit={submitAuth}>
            <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
            <label>
              Имя пользователя
              <input
                required
                maxLength={150}
                value={credentials.username}
                onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
              />
            </label>
            <label>
              Пароль
              <input
                required
                minLength={6}
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
              />
            </label>
            <button type="submit" disabled={submitting}>{submitting ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
            <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage('') }}>
              {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={saveProfile}>
            <h2>Мой профиль</h2>
            <p className="username">Логин: {user.username}</p>
            <label>
              Имя
              <input maxLength={100} value={profile.first_name ?? ''} onChange={(event) => setProfile({ ...profile, first_name: event.target.value })} />
            </label>
            <label>
              Специализация
              <select value={profile.specialization ?? 'other'} onChange={(event) => setProfile({ ...profile, specialization: event.target.value as Specialization })}>
                {specializations.length === 0 && <option value={profile.specialization ?? 'other'}>Список специализаций недоступен</option>}
                {specializations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              О себе
              <textarea rows={5} value={profile.bio ?? ''} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
            </label>
            <label>
              Гонорар
              <input
                inputMode="decimal"
                placeholder="Например, 5000.00"
                aria-describedby="fee-help fee-error"
                value={profile.fee ?? ''}
                onChange={(event) => {
                  setProfile({ ...profile, fee: event.target.value })
                  setFeeError('')
                }}
              />
            </label>
            <small id="fee-help" className="field-help">Пример: 5000 или 5000.00. Валюта не указывается.</small>
            {feeError && <p id="fee-error" className="field-error">{feeError}</p>}
            <button type="submit" disabled={submitting}>{submitting ? 'Сохранение...' : 'Сохранить изменения'}</button>
          </form>
        )}
      </section>
    </main>
  )
}

