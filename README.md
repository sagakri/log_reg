# Band Members

React / Vite клиент для https://inai-col3.fishrungames.com.

Запуск: `npm install`, `npm run dev`. Проверка и сборка: `npm run build`.
Переопределить сервер можно через `VITE_API_URL` в `.env.local`.

## Авторизация

Контракт проверен по `/api/schema/`:
- POST `/api/register/` и `/api/login/`: username/password; access и необязательный user в JSON, refresh в HttpOnly cookie.
- POST `/api/token/refresh/`: refresh передаётся браузером в cookie, тело запроса не требуется.
- GET/PATCH `/api/profile/`: Authorization: Bearer access.
- POST `/api/logout/`: сервер удаляет refresh cookie.

Все запросы используют credentials: include. Access хранится в памяти, после перезагрузки восстанавливается через refresh. Старые токены из localStorage удаляются. Одновременные запросы используют одно обновление токена; защищённый запрос повторяется не более одного раза. Ошибки сервера показываются понятным сообщением без HTML.

Для работы между GitHub Pages и API сервер должен разрешать Origin https://sagakri.github.io и credentials; cookie должна поддерживать межсайтовые запросы (SameSite=None; Secure). Блокировка сторонних cookie браузером может препятствовать восстановлению сессии.

## Публикация

Push в main запускает `.github/workflows/deploy.yml`. В GitHub Pages источником должен быть GitHub Actions.
