# Team Task Manager

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Architecture Diagram](#architecture-diagram)
5. [Repository Structure](#repository-structure)
6. [Setup & Installation](#setup--installation)
7. [Running the Application](#running-the-application)
8. [Environment Variables](#environment-variables)
9. [API Documentation](#api-documentation)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Contributing](#contributing)
13. [License](#license)

---

## Project Overview
**Team Task Manager** is a full‑stack monorepo that provides a modern task‑management solution for teams. It consists of:

* **Frontend** – a React application built with Vite, offering a responsive UI and client‑side routing.
* **Backend** – an Express server written in TypeScript, exposing a RESTful API and handling authentication, authorization, and data persistence.
* **Shared Libraries** – reusable TypeScript utilities, API client, Zod schemas, and database models located under the `lib/` folder.

The repository is configured as an npm workspace, allowing each package (`frontend`, `backend`, `lib/*`) to be built, linted, and tested independently while sharing a single `node_modules` tree.

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui components |
| **Backend** | Node.js, Express, TypeScript, Zod (validation), Pino (logging) |
| **Database** | MongoDB (via Mongoose) |
| **Auth** | JSON Web Tokens (JWT), bcrypt |
| **Package Management** | npm (workspace) |
| **Dev Tools** | concurrently, ts-node, eslint, prettier |

---

## Features
- **User Authentication** – Secure login with JWT and password hashing (bcrypt).
- **Role‑Based Access** – Different permissions for regular users and admins.
- **Project & Task Management** – Create, read, update, delete projects and tasks.
- **Activity Logging** – Centralised logging using `pino` for easy debugging.
- **Rate Limiting & Security** – Helmet, CORS, and express‑rate‑limit protect the API.
- **Shared Types** – Type‑safe API contracts using Zod schemas (`lib/api-zod`).
- **Monorepo Workspace** – Shared utilities and API client (`lib/api-client-react`).
- **Docker Ready** – Dockerfile and docker‑compose files are included for containerised development.

---

---

## Repository Structure
```
Team-Task-Manager/
├─ backend/                # Express API
│   ├─ src/                # Source code
│   └─ tsconfig.json
├─ frontend/               # React application
│   ├─ src/                # React components & pages
│   └─ vite.config.ts
├─ lib/                    # Shared libraries
│   ├─ api-client-react/   # React API client wrapper
│   ├─ api-spec/           # OpenAPI spec & Orval config
│   ├─ api-zod/            # Zod schemas for request/response validation
│   └─ db/                 # Database models & connection logic
├─ scripts/                # Utility scripts (e.g., CI helpers)
├─ .env.example            # Example environment file
├─ package.json            # Workspace root scripts
└─ README.md               # **You are here**
```

---

## Setup & Installation
1. **Clone the repository** (already done).
2. **Install dependencies**
   ```bash
   npm install   # Installs all workspace packages
   ```
3. **Create an `.env` file** at the repository root (copy from `.env.example`). Required variables:
   - `PORT` – Port for the backend (default `3000`).
   - `MONGODB_URI` – Connection string for MongoDB.
   - `JWT_SECRET` – Secret key for signing JWTs.
   - `CORS_ORIGIN` – Frontend origin (e.g., `http://localhost:5173`).
4. **(Optional) Run MongoDB locally** using Docker:
   ```bash
   docker run -d -p 27017:27017 --name tm-mongo mongo:latest
   ```

---

## Running the Application
### Development
```bash
npm run dev
```
This command uses `concurrently` to start:
* **Frontend** – Vite dev server on `http://localhost:5173` (proxying `/api/*` to the backend).
* **Backend** – `tsx` watches the `backend/src` folder and restarts on changes.

### Production
```bash
npm run build   # Builds frontend and backend
npm run start   # Starts the compiled backend which serves the static frontend
```
The production server listens on the port defined by `PORT` (or the environment‑provided value on platforms like Railway/Heroku).

---

## Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port for the Express server | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/team-manager` |
| `JWT_SECRET` | Secret for signing JWT tokens | `supersecretkey` |
| `CORS_ORIGIN` | Allowed origin for CORS (frontend URL) | `http://localhost:5173` |

---

## API Documentation
The OpenAPI specification lives in `lib/api-spec/openapi.yaml`. You can generate a client with Orval (`npm run generate:client`) or view the spec using Swagger UI locally:
```bash
npm run dev   # Then navigate to http://localhost:5173/api-docs (if configured)
```

---

## Testing
Unit and integration tests are written with **Jest** and **Supertest**.
```bash
npm run test          # Run all tests
npm run test:watch   # Watch mode during development
```
Coverage reports are generated in the `coverage/` directory.

---

## Deployment
### Railway (or Heroku)
1. Connect the GitHub repository to Railway.
2. Add the required environment variables in the Railway dashboard.
3. Railway will automatically run `npm run start` as defined in the `Procfile`:
   ```
   web: npm run start
   ```
### Docker
A `Dockerfile` is provided at the repository root. Build and run with:
```bash
docker build -t team-task-manager .
docker run -p 3000:3000 -e MONGODB_URI=... -e JWT_SECRET=... team-task-manager
```

---

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Make your changes, ensuring linting passes (`npm run lint`).
4. Write or update tests.
5. Submit a pull request with a clear description of the changes.

---

## License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.
