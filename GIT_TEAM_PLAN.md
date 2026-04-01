# Ke Hoach Phan Cong Git Cho Team 5 Nguoi

## 1. Muc tieu

- Tao `repository` moi de lam lich su Git ro rang hon.
- Moi nguoi phu trach mot pham vi file co ranh gioi ro rang.
- Khong chia theo "moi nguoi vai file random", ma chia theo `feature + owner`.
- Moi file chi nen co `1 owner chinh` de tranh conflict va de commit nhin hop ly.

## 2. Pham vi file duoc tinh trong ke hoach

Ke hoach nay tinh tren `106 file chinh`, chua tinh `specs/README.md`.

- `backend/src`: 39 file
- `backend/db`: 13 file
- `frontend/src`: 45 file
- `root config`: 9 file

`root config` trong ke hoach gom:

- `.gitignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `backend/package.json`
- `backend/.env.example`
- `frontend/package.json`
- `frontend/.env.example`
- `frontend/vite.config.js`

Tong cong: `39 + 13 + 45 + 9 = 106 file`

## 3. Nguyen tac chia file

- Ban giu `backend` va cac file `frontend shared`.
- 4 thanh vien con lai chia `frontend` theo tung cum chuc nang.
- Khong sua file cua owner khac neu chua bao truoc.
- Cac file dung chung nhu `App.jsx`, `api.js`, `index.css`, `layouts`, `context` chi de `1 nguoi` giu.

## 4. Phan cong cu the

### Nguoi 1: Truong nhom / Backend + Shared Frontend

So file phu trach: `71 file`

#### 4.1. Root config: 9 file

- `.gitignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `backend/package.json`
- `backend/.env.example`
- `frontend/package.json`
- `frontend/.env.example`
- `frontend/vite.config.js`

#### 4.2. Backend source: 39 file

- `backend/src/app.js`
- `backend/src/config/db.js`
- `backend/src/config/env.js`
- `backend/src/middlewares/api-key.js`
- `backend/src/middlewares/auth.js`
- `backend/src/middlewares/error-handler.js`
- `backend/src/modules/achievements/achievements.controller.js`
- `backend/src/modules/achievements/achievements.routes.js`
- `backend/src/modules/achievements/achievements.service.js`
- `backend/src/modules/admin/admin.controller.js`
- `backend/src/modules/admin/admin.routes.js`
- `backend/src/modules/admin/admin.service.js`
- `backend/src/modules/auth/auth.controller.js`
- `backend/src/modules/auth/auth.routes.js`
- `backend/src/modules/auth/auth.service.js`
- `backend/src/modules/docs/docs.routes.js`
- `backend/src/modules/docs/openapi.js`
- `backend/src/modules/friends/friends.controller.js`
- `backend/src/modules/friends/friends.routes.js`
- `backend/src/modules/friends/friends.service.js`
- `backend/src/modules/games/game-data.js`
- `backend/src/modules/games/games.controller.js`
- `backend/src/modules/games/games.routes.js`
- `backend/src/modules/games/games.service.js`
- `backend/src/modules/messages/messages.controller.js`
- `backend/src/modules/messages/messages.routes.js`
- `backend/src/modules/messages/messages.service.js`
- `backend/src/modules/profile/profile.controller.js`
- `backend/src/modules/profile/profile.routes.js`
- `backend/src/modules/profile/profile.service.js`
- `backend/src/modules/ranking/ranking.controller.js`
- `backend/src/modules/ranking/ranking.routes.js`
- `backend/src/modules/ranking/ranking.service.js`
- `backend/src/modules/users/users.controller.js`
- `backend/src/modules/users/users.routes.js`
- `backend/src/modules/users/users.service.js`
- `backend/src/routes/index.js`
- `backend/src/server.js`
- `backend/src/utils/http.js`

#### 4.3. Backend db: 13 file

- `backend/db/migrations/20260328000100_enable_extensions.cjs`
- `backend/db/migrations/20260328000200_create_core_tables.cjs`
- `backend/db/migrations/20260328000300_create_game_tables.cjs`
- `backend/db/migrations/20260328000400_create_social_tables.cjs`
- `backend/db/migrations/20260328000500_create_admin_tables.cjs`
- `backend/db/migrations/20260328000600_rename_profile_country_to_city.cjs`
- `backend/db/seeds/00_reset.cjs`
- `backend/db/seeds/01_roles.cjs`
- `backend/db/seeds/02_games.cjs`
- `backend/db/seeds/03_users.cjs`
- `backend/db/seeds/04_game_instructions.cjs`
- `backend/db/seeds/05_social.cjs`
- `backend/db/seeds/06_gameplay_and_engagement.cjs`

#### 4.4. Frontend shared: 10 file

- `frontend/src/App.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/ThemeContext.jsx`
- `frontend/src/data/games.js`
- `frontend/src/index.css`
- `frontend/src/layouts/AdminLayout.jsx`
- `frontend/src/layouts/ClientLayout.jsx`
- `frontend/src/lib/api.js`
- `frontend/src/main.jsx`

### Nguoi 2: Tai khoan + Ho so + Xep hang

So file phu trach: `8 file`

- `frontend/src/pages/HomePage.jsx`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/RegisterPage.jsx`
- `frontend/src/pages/client/ProfilePage.jsx`
- `frontend/src/pages/client/AchievementsPage.jsx`
- `frontend/src/pages/client/RankingPage.jsx`
- `frontend/src/components/ui/EmptyState.jsx`
- `frontend/src/components/ui/SectionTitle.jsx`

### Nguoi 3: Ban be + Tin nhan + Tim kiem

So file phu trach: `8 file`

- `frontend/src/pages/client/FriendsPage.jsx`
- `frontend/src/pages/client/MessagesPage.jsx`
- `frontend/src/components/messages/ConversationListItem.jsx`
- `frontend/src/components/messages/MessageBubble.jsx`
- `frontend/src/components/social/FriendCard.jsx`
- `frontend/src/components/ui/Pagination.jsx`
- `frontend/src/components/ui/SearchInput.jsx`
- `frontend/src/components/ui/toast.jsx`

### Nguoi 4: Giao dien Quan tri

So file phu trach: `7 file`

- `frontend/src/pages/admin/AdminAchievementsPage.jsx`
- `frontend/src/pages/admin/AdminDashboardPage.jsx`
- `frontend/src/pages/admin/AdminGamesPage.jsx`
- `frontend/src/pages/admin/AdminStatisticsPage.jsx`
- `frontend/src/pages/admin/AdminUsersPage.jsx`
- `frontend/src/components/admin/AdminTable.jsx`
- `frontend/src/components/ui/select.jsx`

### Nguoi 5: Khu vuc Game Frontend

So file phu trach: `12 file`

- `frontend/src/components/BoardGrid.jsx`
- `frontend/src/components/GameCatalogBoard.jsx`
- `frontend/src/components/GameChrome.jsx`
- `frontend/src/components/games/FreeDrawGame.jsx`
- `frontend/src/components/games/LineGame.jsx`
- `frontend/src/components/games/Match3Game.jsx`
- `frontend/src/components/games/MemoryGame.jsx`
- `frontend/src/components/games/PlaceholderGame.jsx`
- `frontend/src/components/games/SnakeGame.jsx`
- `frontend/src/components/games/gameHelpers.jsx`
- `frontend/src/pages/client/GamesPage.jsx`
- `frontend/src/pages/games/GamePage.jsx`

## 5. Branch de dung

Khuyen nghi tao branch nhu sau:

- `main`: branch on dinh
- `dev`: branch tich hop
- `feat/01-backend-shared`
- `feat/02-account-ranking`
- `feat/03-social-messages`
- `feat/04-admin-frontend`
- `feat/05-game-frontend`

## 6. Cach trien khai repo moi

### 6.1. Nguoi 1 tao repo moi

```bash
git init
git add .
git commit -m "chore: initialize project structure"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
git checkout -b dev
git push -u origin dev
```

### 6.2. Moi thanh vien clone va tao branch rieng

```bash
git clone <repo-url>
cd <repo-name>
git checkout dev
git checkout -b feat/02-account-ranking
```

### 6.3. Moi nguoi chi commit pham vi file cua minh

Khong nen push 1 lan ca cuc. Moi nguoi nen chia it nhat `3-5 commit co y nghia`.

Vi du:

- `feat(profile): add profile update form`
- `feat(ranking): add pagination and scope filter`
- `fix(messages): prevent empty message submission`
- `feat(admin-users): add role update panel`
- `style(games): refine board controls`

## 7. Thu tu push va merge

De giam conflict, nen merge theo thu tu nay:

1. `Nguoi 1` push `backend + shared shell` len `dev`
2. `Nguoi 2` push `account + ranking`
3. `Nguoi 3` push `social + messages`
4. `Nguoi 4` push `admin frontend`
5. `Nguoi 5` push `game frontend`
6. `Nguoi 1` merge tung branch vao `dev`
7. Sau khi `dev` on dinh moi merge sang `main`

## 8. Quy tac tranh conflict

- `Nguoi 1` la owner duy nhat cua:
  - `frontend/src/App.jsx`
  - `frontend/src/lib/api.js`
  - `frontend/src/index.css`
  - `frontend/src/layouts/**`
  - `frontend/src/context/**`
  - `backend/**`
  - `package.json` va cac file config
- Neu can sua file shared, thanh vien khac phai bao truoc.
- Neu 2 nguoi cung muon sua 1 file, uu tien de owner sua va nguoi con lai mo ta nhu cau.

## 9. Cach chia commit de lich su Git hop ly

Moi thanh vien nen co mau commit nhu sau:

### Nguoi 1

- `chore(repo): bootstrap monorepo config`
- `feat(auth): add login and register api`
- `feat(games): add save and result endpoints`
- `feat(admin): add statistics and user management api`
- `docs(swagger): document protected admin endpoints`

### Nguoi 2

- `feat(auth-ui): add login page`
- `feat(profile): add profile update screen`
- `feat(ranking): add ranking filters and pagination`

### Nguoi 3

- `feat(friends): add search and friend request flow`
- `feat(messages): add conversation list`
- `feat(messages): add direct message thread`

### Nguoi 4

- `feat(admin-dashboard): add overview cards`
- `feat(admin-users): add user detail and role update`
- `feat(admin-games): add game config editor`

### Nguoi 5

- `feat(games-ui): add game shell and board chrome`
- `feat(snake): add snake interaction flow`
- `feat(match3): add match3 board logic`
- `feat(free-draw): add free draw save and submit flow`

## 10. Cach lam thuc te de nhin tu nhien hon

- Moi nguoi nen lam tren branch rieng trong `2-4 ngay`, khong nen tat ca commit trong cung 1 gio.
- Moi nguoi nen co ca `feat`, `fix`, `style` nho, khong chi 1 commit `upload`.
- Nen tao PR vao `dev`, de lai title ro rang.
- Nen co it nhat 1-2 lan sua sau review, nhu vay lich su Git se hop ly hon.

## 11. Ket luan

Phuong an nay da cover du `106 file chinh` trong repo theo ke hoach.

Tong ket so file moi nguoi:

- `Nguoi 1`: 71 file
- `Nguoi 2`: 8 file
- `Nguoi 3`: 8 file
- `Nguoi 4`: 7 file
- `Nguoi 5`: 12 file

Tong frontend do 4 thanh vien con lai va phan frontend shared cua Nguoi 1 da cover du:

- `45/45 frontend source file`

Tong backend va config do Nguoi 1 cover du:

- `39/39 backend source file`
- `13/13 backend db file`
- `9/9 root config file`

