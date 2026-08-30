# 🤝 Contributing to Orbit

Thank you for your interest in contributing to Orbit! We welcome contributions to help build a healthier, privacy-respecting social media ecosystem for teenagers and communities everywhere.

---

## 🧭 Core Principles

1. **Privacy First:** Never introduce telemetry, tracking pixels, third-party analytics SDKs, or cloud dependencies.
2. **Strictly Chronological:** Feeds must always remain in chronological order. No engagement-based ranking models or algorithmic filtering.
3. **Local Self-Hosting:** Orbit must run seamlessly from a laptop with zero external database dependencies (SQLite only).
4. **Intimate Circles:** Micro-groups must never exceed the hard limit of 10 members.

---

## 🛠️ Development Workflow

1. Fork and clone the repository.
2. Run `npm run setup` to install packages and configure the SQLite database.
3. Run `npm run db:seed` to populate test data.
4. Run `npm run dev` to start both the backend and frontend dev servers.
5. Make your modifications cleanly, maintaining TypeScript type safety across both `client/` and `server/`.
6. Verify code compiles with `npm run build` in both directories.
7. Open a Pull Request with a clear summary of your changes.

---

## 🧪 Code Standards

* **TypeScript:** Strict type checking with no implicit `any`.
* **Prisma:** Update `schema.prisma` whenever modifying the database structure, followed by `npx prisma db push`.
* **Zero Placeholders:** Never leave unimplemented placeholder comments (`// TODO: implement this`). Write complete, robust solutions.
* **Component Modularity:** Follow the established component structure with clear Separation of Concerns.
