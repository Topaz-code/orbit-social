# Orbit

Orbit is a self-hosted social platform designed to run locally on your own machine. It bundles a chronological news feed, real-time messaging, audio and video calling, and media sharing into a single full-stack app.

---

## Features

- **Chronological feed:** Posts appear strictly in publication order without recommendation algorithms or feed ranking.
- **Local storage:** All data lives in a local SQLite database with no telemetry or external cloud dependencies.
- **Real-time chat and presence:** Built-in Aedes MQTT broker over WebSockets handles direct messaging, group chats, typing indicators, and online status.
- **Voice and video calls:** Peer-to-peer WebRTC calling using an embedded PeerJS signaling server.
- **Micro-groups:** Group chats are capped at 10 members.
- **24-hour stories:** Photo and video stories that delete automatically after 24 hours.

---

## Architecture

```
                               ┌────────────────────────────────┐
                               │       Orbit React Client       │
                               │  Vite + React 18 + Tailwind    │
                               │  Zustand + TanStack Query      │
                               │  MQTT.js + PeerJS Client       │
                               └──────────────┬─────────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     │ REST API (JSON)       MQTT (WS:8883)            │ WebRTC Signaling
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │     Express Server      │                       │   Embedded Aedes Broker │
        │  JWT Auth + Rate Limits │                       │  Presence & Typing Mesh │
        │  Multer Media Uploads   │                       │  Push Notification Bus  │
        └────────────┬────────────┘                       └─────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │   Prisma ORM + SQLite   │
        │   13 Normalized Tables  │
        │  Cascade Deletions & FK │
        └─────────────────────────┘
```

### Backend
- **Runtime:** Node.js (v20+) and TypeScript
- **Framework:** Express with Helmet, CORS, and compression
- **Database & ORM:** SQLite via Prisma ORM (13 relational tables)
- **Real-time engine:** Embedded Aedes MQTT broker (TCP `1883`, WebSocket `8883`)
- **Calling engine:** Embedded PeerJS server (`/peerjs`) with WebRTC
- **Authentication:** JWT access and refresh tokens, bcryptjs password hashing (10 rounds)
- **Media:** Multer file uploads, OpenGraph metadata scraper, cron cleanup for stories

### Frontend
- **Stack:** Vite, React 18, TypeScript, Tailwind CSS, Radix UI
- **State management:** Zustand (auth, theme, notifications, chat, calls)
- **Server state:** TanStack Query v5 with caching and optimistic updates
- **Real-time clients:** MQTT.js WebSocket client and PeerJS WebRTC client
- **Routing:** React Router v6 with route guards

---

## Quick Start

### Prerequisites
- Node.js 20.0.0 or later
- npm 9.0.0 or later

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/orbit.git
cd orbit

# Install dependencies and set up the database
npm run setup

# Seed demo data (creates 8 test accounts and sample posts)
npm run db:seed

# Start the application
npm run dev
```

The app will be accessible at:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **REST API:** [http://localhost:5000](http://localhost:5000)
- **MQTT WebSocket broker:** `ws://localhost:8883`
- **PeerJS signaling:** [http://localhost:5000/peerjs](http://localhost:5000/peerjs)

---

## Project Structure

```
orbit/
├── client/                     # React frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # UI, Auth, Feed, Chat, Stories, Calls, Groups
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, MQTT manager, PeerJS helpers
│   │   ├── pages/              # Route views
│   │   ├── stores/             # Zustand stores
│   │   ├── styles/             # Global CSS
│   │   └── types/              # Frontend TypeScript definitions
│   └── package.json
│
├── server/                     # Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Demo data seeder
│   ├── src/
│   │   ├── config/             # DB, auth, MQTT, upload configs
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth, validation, upload middleware
│   │   ├── routes/             # REST route handlers
│   │   ├── services/           # Business logic and MQTT publishers
│   │   ├── utils/              # OpenGraph scraper, cleanup jobs, helpers
│   │   └── validators/         # Zod schemas
│   └── package.json
│
├── docs/                       # Documentation
│   ├── SETUP.md                # Installation and configuration
│   ├── API.md                  # REST API reference
│   ├── ARCHITECTURE.md         # System design and data flows
│   ├── MQTT_TOPICS.md          # MQTT topic catalog
│   └── CONTRIBUTING.md          # Contribution guidelines
│
├── docker-compose.yml          # Container configuration
├── LICENSE                     # MIT License
└── package.json                # Monorepo root scripts
```

---

## Documentation

- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)
- [Architecture & Database Design](docs/ARCHITECTURE.md)
- [MQTT Topics & Payloads](docs/MQTT_TOPICS.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)

---

## License

MIT
