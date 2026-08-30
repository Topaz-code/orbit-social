# 🛠️ Orbit Installation & Setup Guide

This guide walks you through setting up, configuring, and running Orbit on your local machine or self-hosted server.

---

## 📋 System Prerequisites

* **Node.js**: `v20.0.0` or higher
* **npm**: `v9.0.0` or higher
* **OS**: Linux, macOS, or Windows
* **Storage**: Minimal disk space required (~50MB for code and SQLite database)

---

## 📦 Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/orbit.git
cd orbit
```

### 2. Environment Configuration

Orbit is pre-configured with default values for local development. If needed, you can customize environment variables by creating `.env` in the `server/` directory:

```bash
cp server/.env.example server/.env
```

#### Default Server Configuration (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# SQLite Database URL
DATABASE_URL="file:./dev.db"

# JWT Secrets
JWT_SECRET=orbit-super-secure-jwt-secret-key-change-in-prod
JWT_REFRESH_SECRET=orbit-super-secure-jwt-refresh-secret-key-change-in-prod
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# MQTT Configuration
MQTT_PORT=1883
MQTT_WS_PORT=8883

# Upload Limits
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=./uploads
```

### 3. Install Dependencies & Initialize Database

Run the monorepo root setup script, which installs packages for both the backend server and frontend client, generates the Prisma client, and applies SQLite database migrations:

```bash
npm run setup
```

Or execute manually:

```bash
# Install root dependencies
npm install

# Setup server
cd server
npm install
npx prisma db push
cd ..

# Setup client
cd client
npm install
cd ..
```

### 4. Seed the Database with Realistic Demo Data

Populate the local SQLite database with 8 rich demo users, chronological posts with media attachments and link previews, threaded comments, direct and group chat histories, active 24h stories, and friendship graphs:

```bash
npm run db:seed
```

### 5. Start the Orbit Platform

Start both the backend Express + MQTT broker and the Vite React frontend in parallel:

```bash
npm run dev
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **MQTT WebSocket:** `ws://localhost:8883`
* **PeerJS Signaling:** [http://localhost:5000/peerjs](http://localhost:5000/peerjs)

---

## 🐳 Docker Deployment (Optional)

Orbit can also be run using Docker and Docker Compose:

```bash
# Build and run containers
docker-compose up --build -d

# Check running status
docker-compose ps
```

---

## 💾 Database Management with Prisma Studio

To inspect, edit, or manage the SQLite database visually through your browser:

```bash
cd server
npx prisma studio
```

Prisma Studio will be available at [http://localhost:5555](http://localhost:5555).
