# 留言板

一个面向真实部署的中文社区留言板。项目使用 Vue 3、Firebase Authentication 与 Cloud Firestore，支持按需加载的无限层级回复、游标分页和保持讨论树完整的软删除。

生产站点：[message-board-8bi.pages.dev](https://message-board-8bi.pages.dev)

## 截图

> 截图尚未加入仓库。建议在部署后补充桌面端留言板、移动端深层回复和登录页截图。

## 功能

- 邮箱/密码注册、登录、持久会话和受保护路由
- 根留言按最新或最早排序，并使用游标分页
- 任意深度回复；每个分支独立懒加载和分页
- 作者专属软删除；已删除节点继续承载已有回复
- 中文错误提示、加载骨架、空状态、Toast 和确认对话框
- 键盘操作、焦点管理、语义化状态通知及响应式深层讨论布局
- Firestore Rules 与 Emulator 自动化安全测试

## 技术栈

- Vue 3、Vite、Vue Router
- Tailwind CSS 4（Vite 插件）
- Firebase Authentication、Cloud Firestore
- Vitest、Firebase Rules Unit Testing、Firebase Emulator Suite
- Cloudflare Pages

项目刻意不使用 Pinia、UI 组件库或 Cloud Functions。当前业务可以由 Firebase Auth、Firestore 客户端 SDK 与 Security Rules 安全完成；只有未来加入管理员审核、永久删除子树或后台维护任务时，才需要可信服务端逻辑。

## 架构

```text
src/
  components/       可复用界面与递归 CommentItem
  composables/       全局认证状态和 Toast
  firebase/          Firebase 初始化与 Emulator 连接
  router/            路由、认证守卫和页面标题
  services/          认证与留言数据访问
  utils/             可独立测试的校验、排序和导航辅助函数
  views/             首页、留言板、认证和 404 页面
tests/
  unit/              纯函数测试
  rules/             Firestore Security Rules 测试
```

认证初始化只注册一个 `onAuthStateChanged` 监听器。受保护页面会等待首次认证状态解析，未登录用户跳转到 `/login`，登录后只接受经过清理的站内重定向地址。

## Firestore 数据模型

### `users/{uid}`

```text
displayName, email, photoURL, createdAt, updatedAt
```

用户只能创建和读取自己的资料；客户端不能更新或删除资料。

### `comments/{commentId}`

```text
userId, userName, userPhotoURL, content,
parentId, rootId,
createdAt, updatedAt,
isDeleted, deletedAt
```

所有节点位于同一个扁平集合中，不使用无限嵌套子集合。根留言的 `parentId` 为 `null`，`rootId` 等于自身文档 ID。回复的 `parentId` 指向直属父节点，`rootId` 继承整棵树的根节点 ID。`CommentItem.vue` 递归渲染节点，但只在用户展开分支时查询该节点的直属子项，因此深度不受数据结构限制，也不会一次加载整棵树。

根留言每页 10 条，可按 `createdAt` 升序或降序读取；回复每个父节点每页 5 条，固定升序。所有下一页查询都使用完整文档快照作为 `startAfter` 游标，并在合并时按 ID 去重。

删除采用不可逆的软删除：作者可将 `content` 清空并写入 `isDeleted`、`deletedAt` 和 `updatedAt`，但不能修改作者、父节点、根节点或创建时间。物理删除、他人删除、恢复已删除节点以及回复已删除父节点均由 Rules 拒绝。

## 本地运行

要求 Node.js 20.19+ 或 22.12+，以及 npm 10+。

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite 通常在 `http://localhost:5173` 启动。没有 Firebase 配置时，公开页面仍可构建和浏览，但注册、登录和留言功能不可用。

## 环境变量

从 Firebase Console 的“项目设置 → 您的应用 → Web 应用”复制公开 Web 配置：

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

这些是 Firebase Web 客户端标识，不是授权边界；数据安全由 Authentication 和 Firestore Rules 提供。绝不要在 `VITE_` 变量中放置服务账号私钥或其他服务器密钥，也不要提交 `.env.local`。

本地 Emulator 可另外配置：

```dotenv
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
VITE_FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

应用只允许开发构建连接 Emulator；生产构建即使误设开关也不会连接本机地址。

## Firebase 项目设置

1. 在 Firebase Console 创建或选择项目，并注册一个 Web 应用。
2. 在 Authentication 的登录方式中启用“电子邮件/密码”。
3. 创建 Cloud Firestore 数据库，并选择与主要用户接近的区域。
4. 安装并登录 Firebase CLI：`firebase login`。
5. 关联目标项目：`firebase use --add`（不要提交个人 `.firebaserc`，除非团队有意共享）。
6. 部署规则：`firebase deploy --only firestore:rules`。
7. 部署索引：`firebase deploy --only firestore:indexes`。
8. 把 Web 应用配置写入本地或 Cloudflare Pages 环境变量。

`firestore.indexes.json` 包含 `parentId + createdAt ASC` 和 `parentId + createdAt DESC` 两个复合索引，分别服务回复/最早排序与最新排序。

## Emulator 与测试

启动完整本地服务：

```bash
npx firebase emulators:start --only auth,firestore
```

安全规则测试脚本会自行启动并关闭独立的 Firestore Emulator，使用 `demo-` 项目 ID，不会连接真实项目：

```bash
npm run test          # 校验、时间、合并去重和重定向单元测试
npm run test:rules    # Firestore Rules 允许/拒绝场景
npm run test:all      # 依次执行全部测试
```

Rules 测试每个用例前清空数据库，覆盖资料隔离、未认证写入、作者伪造、内容边界、父/根节点校验、多层回复、已删除父节点、软删除、不可变字段、恢复与物理删除。

## 构建与预览

```bash
npm run build
npm run preview
```

生产文件输出到 `dist/`。`public/_redirects` 为 Cloudflare Pages 提供 Vue Router history 模式的 SPA 回退，`public/_headers` 添加基础浏览器安全响应头。

## Cloudflare Pages 部署

1. 在 Cloudflare Pages 中连接此仓库，选择 Vue/Vite 或手动配置。
2. Build command 设置为 `npm run build`。
3. Build output directory 设置为 `dist`。
4. Node.js 版本使用 20.19+ 或 22.12+。
5. 在 Production 和需要的 Preview 环境中配置上述六个 `VITE_FIREBASE_*` 变量。
6. 不要在 Cloudflare 中设置 `VITE_USE_FIREBASE_EMULATORS=true`。
7. 首次部署后直接访问 `/board`、`/login`、`/register` 和任意不存在路径，确认 SPA 回退正常。
8. 将 Pages 生产域名加入 Firebase Authentication 的“已获授权的网域”。

部署前应先发布 Firestore Rules 和索引；Cloudflare Pages 只托管静态前端，不会代替 Firebase 后端配置。

## 安全与可访问性

Firestore Rules 使用字段白名单、认证 UID、父文档存在性和不可变字段差异检查保护写入。客户端校验用于即时反馈，不替代服务端 Rules。页面包含跳至主内容链接、语义化地标、可见焦点、表单错误关联、状态/错误播报、键盘可操作按钮，以及支持 Escape、焦点限制和关闭后焦点恢复的确认对话框。移动端会降低深层回复缩进，长用户名和无空格长文本会安全换行。

## npm scripts

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 创建生产构建 |
| `npm run preview` | 本地预览 `dist/` |
| `npm run test` | 运行 Vitest 单元测试 |
| `npm run test:rules` | 在 Firestore Emulator 运行 Rules 测试 |
| `npm run test:all` | 运行全部自动化测试 |
