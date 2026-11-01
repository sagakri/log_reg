# Band Members client

Простой React-клиент для API домашнего задания: регистрация, вход, выход и редактирование своего профиля.

## Запуск

```bash
npm install
npm run dev
```

Приложение по умолчанию обращается к `https://inai-col2.fishrungames.com`. Чтобы использовать другой сервер, создайте файл `.env.local`:

```env
VITE_API_URL=https://example.com
```

## Сборка

```bash
npm run build
```

## GitHub Pages

В репозитории уже есть workflow `.github/workflows/deploy.yml`. После отправки проекта в ветку `main`:

1. Откройте **Settings → Pages** в репозитории.
2. В разделе **Build and deployment** выберите источник **GitHub Actions**.
3. Дождитесь завершения workflow во вкладке **Actions**.

Если API не разрешает запросы с домена `*.github.io`, нужно добавить адрес GitHub Pages в CORS-настройки бэкенда. Клиент отправляет сессию с `credentials: 'include'` и дополнительно сохраняет заголовок `Session-Id`, если API его возвращает.
