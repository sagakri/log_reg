# Band Members client

React-клиент для регистрации и личного кабинета музыканта с JWT-аутентификацией.

## Запуск

```bash
npm install
npm run dev
```

Приложение по умолчанию обращается к `https://inai-col3.fishrungames.com`. Чтобы использовать другой сервер, создайте файл `.env.local`:

```env
VITE_API_URL=https://example.com
# Optional: change these if Swagger documents different paths
VITE_TOKEN_PATH=/api/token/
VITE_TOKEN_REFRESH_PATH=/api/token/refresh/
VITE_REGISTER_PATH=/api/register/
VITE_PROFILE_PATH=/api/profile/
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

Клиент ожидает SimpleJWT маршруты `POST /api/token/` (поля `access` и `refresh`) и `POST /api/token/refresh/` (поле `refresh`), а регистрацию и профиль вызывает через `/api/register/` и `/api/profile/`. Access token отправляется в заголовке `Authorization: Bearer ...`; при ответе `401` клиент один раз обновляет его и повторяет запрос. Выход удаляет токены на клиенте.

Эти маршруты основаны на типичном контракте SimpleJWT и прежних маршрутах профиля. Swagger-схема нового сервера не была доступна во время реализации, поэтому перед публикацией нужно сверить точные пути и поля с `/api/docs/`. Если API не разрешает запросы с домена `*.github.io`, адрес GitHub Pages нужно добавить в CORS-настройки бэкенда.
