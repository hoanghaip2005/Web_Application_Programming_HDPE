# HDPE Board Game Platform

Monorepo gồm `frontend` React/Vite và `backend` Express/Knex cho hệ thống board game.

## Chức năng chính

- Xác thực, phân quyền `user/admin`, đăng ký có validation.
- 7 game: `caro5`, `caro4`, `tictactoe`, `snake`, `match3`, `memory`, `free-draw`.
- Hồ sơ người dùng, upload avatar lên Supabase Storage.
- Kết bạn, tin nhắn, thành tựu, ranking theo game.
- Admin dashboard, quản lý người dùng, quản lý game, thống kê.
- Swagger UI có bảo vệ bằng `API key + JWT`.

## Chạy dự án

1. Cài dependency:

```bash
npm install
```

2. Tạo file môi trường:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Chạy migration và seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Chạy frontend + backend:

```bash
npm run dev
```

Frontend local chạy ở `http://localhost:5173`. Backend chạy ở `http://localhost:4000` và `https://localhost:4443`.
Trong môi trường dev, Vite proxy sẵn `/api` và `/api-docs` sang backend HTTPS.

## Tài khoản seed

- Admin: `admin@hdpe.local` / `123456`
- User: `user@hdpe.local` / `123456`

## HTTPS

Backend hỗ trợ chạy thêm một listener HTTPS nếu cấu hình:

- `HTTPS_PORT`
- `HTTPS_KEY_PATH`
- `HTTPS_CERT_PATH`
- `HTTPS_CA_PATH` nếu cần

Ví dụ với cert local trong `backend/certs`:

```bash
HTTPS_PORT=4443
HTTPS_KEY_PATH=./certs/localhost-key.pem
HTTPS_CERT_PATH=./certs/localhost.pem
```

Khi có đủ `key + cert`, backend sẽ mở thêm `https://localhost:<HTTPS_PORT>`.
Để frontend local dùng backend HTTPS mà không vướng lỗi cert trên trình duyệt, dùng Vite proxy:

```bash
VITE_API_URL=/api
```

Nếu deploy frontend tách riêng backend, khi đó mới đổi sang URL tuyệt đối kiểu:

```bash
VITE_API_URL=https://your-backend-host/api
```

## API docs

- URL: `/api-docs/`
- Cần `x-api-key` hợp lệ và JWT hợp lệ
- Từ giao diện admin có sẵn link mở Swagger UI với đủ query `token + apiKey`
