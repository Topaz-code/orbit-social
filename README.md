# 🪐 Orbit — Self-Hosted, Privacy-Focused Social Platform

> **Break free from algorithmic feeds, addictive engagement traps, and surveillance capitalism.** Orbit combines the best of **Facebook** (news feed, profiles, micro-groups), **Telegram/WhatsApp** (real-time chat, phone/username messaging, voice notes), **X/Twitter** (concise posts, engagement, hashtags), and **YouTube** (rich media uploads) — into one lightweight, self-hostable full-stack application that runs entirely from your personal laptop.

---

## 🌟 Why Orbit?

Traditional social platforms are engineered to maximize time-on-screen using opaque algorithmic recommendation engines, targeted advertisements, and data harvesting. Orbit is built with an entirely different philosophy:

* ⏱️ **Strictly Chronological Feeds:** Zero algorithmic manipulation or shadow-ranking. Posts appear exactly when they were published.
* 🔒 **Self-Hosted & Private:** All data resides in a local SQLite file on your machine. No telemetry, no tracker pixels, and no third-party cloud vendor lock-in.
* ⚡ **Embedded Real-Time Mesh:** Built-in Aedes MQTT broker handles instant chat, typing indicators, presence, and live notifications over lightweight WebSockets without requiring external cloud services.
* 📞 **Peer-to-Peer Voice & Video Calls:** WebRTC audio and video calling powered by PeerJS with STUN signaling embedded directly in Express.
* 👥 **Intimate Micro-Groups:** Hard-capped at **10 members per group** to foster authentic, high-trust friendships rather than mass broadcasting.
* ⏳ **24-Hour Ephemeral Stories:** Photo & video stories with interactive text overlays that automatically self-delete after 24 hours.

---

## 🏗️ Tech Stack

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
* **Runtime:** Node.js (v20+) & TypeScript
* **Framework:** Express.js with Helmet, CORS, and Compression
* **Database & ORM:** SQLite via Prisma ORM (13 normalized relational tables)
* **Real-Time Engine:** Embedded Aedes MQTT Broker (TCP `1883`, WebSocket `8883`)
* **Calling Engine:** Embedded PeerJS Server (`/peerjs`) + WebRTC
* **Authentication:** JWT Access & Refresh Tokens, bcryptjs passwords (salt rounds 10)
* **Media Processing:** Multer with file type validation, OpenGraph scraper, 24h cron cleanup

### Frontend
* **Build System:** Vite + React 18 + TypeScript
* **Styling:** Tailwind CSS + Radix UI Primitives + Custom Animations (Heart Burst, Story Shimmer)
* **State Management:** Zustand (Auth, Theme, Notifications, Chat, Active Calls)
* **Server State:** TanStack Query v5 with optimistic updates and caching
* **Real-Time Client:** MQTT.js WebSocket client + PeerJS WebRTC wrapper
* **Routing:** React Router v6 with Protected & Public route guards

---

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js** v20.0.0 or later
* **npm** v9.0.0 or later

### 2. Installation & Setup

Clone the repository and install all dependencies for both client and server:

```bash
# Clone the repository
git clone https://github.com/your-username/orbit.git
cd orbit

# Setup database & install all dependencies
npm run setup
```

### 3. Seed Demo Data

Orbit comes with 8 realistic demo accounts, active stories, group chats, and rich media posts out of the box:

```bash
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be accessible at:
* 🌐 **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
* 📡 **REST API Server:** [http://localhost:5000](http://localhost:5000)
* ⚡ **MQTT WebSocket Broker:** `ws://localhost:8883`
* 🔌 **PeerJS Signaling Server:** [http://localhost:5000/peerjs](http://localhost:5000/peerjs)

---

## 🔑 Demo Accounts

All demo accounts share the password `orbit123` and security answer `shadow`:

| Username | Name | Role / Interest |
|---|---|---|
| `alexchen` | Alex Chen | Astronomy, Coding & Sci-Fi |
| `sarahj` | Sarah Jenkins | Film Photography & Darkroom |
| `emilyw` | Emily Watson | Indie Music & Vinyl Records |
| `davidm` | David Martinez | Trail Running & Bouldering |
| `maya_p` | Maya Patel | Robotics & Embedded Hardware |
| `liam_k` | Liam Kowalski | Game Development & Pixel Art |
| `zoe_r` | Zoe Rivera | Graphic Design & Typography |
| `jordan_b` | Jordan Brooks | Coffee Roasting & Skateboarding |

---

## 📁 Repository Structure

```
orbit/
├── client/                     # React Frontend Application
│   ├── public/                 # Static assets & Orbit SVG logo
│   ├── src/
│   │   ├── components/         # Modular UI, Auth, Feed, Chat, Stories, Calls, Groups
│   │   ├── hooks/              # Custom React hooks (useAuth, useMQTT, useChat, etc.)
│   │   ├── lib/                # API client, MQTT manager, PeerJS helper, utility functions
│   │   ├── pages/              # 13 Application views (Feed, Messages, Profile, Groups, etc.)
│   │   ├── stores/             # Zustand stores for reactive state
│   │   ├── styles/             # Global CSS and custom animations
│   │   └── types/              # Frontend TypeScript definitions
│   └── package.json
│
├── server/                     # Express Backend Application
│   ├── prisma/
│   │   ├── schema.prisma       # 13 SQLite relational models
│   │   └── seed.ts             # Realistic 8-user demo seeder
│   ├── src/
│   │   ├── config/             # Database, Auth, MQTT, Upload configurations
│   │   ├── controllers/        # Express REST controllers
│   │   ├── middleware/         # Auth, validation, error, upload middleware
│   │   ├── routes/             # REST route endpoints
│   │   ├── services/           # Business logic & MQTT event publishers
│   │   ├── utils/              # OpenGraph scraper, Story cleanup cron, password helpers
│   │   └── validators/         # Zod request validation schemas
│   └── package.json
│
├── docs/                       # Complete Documentation
│   ├── SETUP.md                # Detailed installation & configuration guide
│   ├── API.md                  # Comprehensive REST API reference
│   ├── ARCHITECTURE.md         # System design, ER diagram, and real-time flows
│   ├── MQTT_TOPICS.md          # MQTT topic catalog & payload schemas
│   └── CONTRIBUTING.md          # Code standards & contribution guidelines
│
├── docker-compose.yml          # Containerized deployment config
├── LICENSE                     # MIT License
└── package.json                # Monorepo root scripts
```

---

## 📖 Complete Documentation

* 📘 [Detailed Setup Guide](docs/SETUP.md)
* 🔌 [REST API Specification](docs/API.md)
* 🏛️ [System Architecture & Database Design](docs/ARCHITECTURE.md)
* 📡 [MQTT Real-Time Topics & Payloads](docs/MQTT_TOPICS.md)
* 🤝 [Contributing Guidelines](docs/CONTRIBUTING.md)

---

## 📜 License

Orbit is licensed under the [MIT License](LICENSE).
