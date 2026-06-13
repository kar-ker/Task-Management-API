# Express.js Backend

Express.js + TypeScript backend for a to-do style API. It uses SQLite for persistence, JWT access tokens, refresh tokens, and protected CRUD endpoints.

Deployed API: [https://kerkaa-express.proxy.itcollege.ee](https://kerkaa-express.proxy.itcollege.ee)

Deployed frontend apps that use the backend:
- React version [kerkaa-react-app-express.proxy.itcollege.ee](kerkaa-react-app-express.proxy.itcollege.ee)
- Vue version [kerkaa-vue-app-express.proxy.itcollege.ee](kerkaa-vue-app-express.proxy.itcollege.ee)

## Features

- Authentication endpoints for register, login, and token refresh
- Protected CRUD endpoints for list items, todo tasks, categories, and priorities
- SQLite persistence with automatic migrations
- JWT-based authorization for API access
- Docker support for local development and deployment

## Setup

```bash
npm install
npm run dev
```

The API runs on [http://localhost:3001](http://localhost:3001) by default.

## Development

```bash
npm run build
npm test
npm run start
```

## Docker

Build the image:

```bash
docker build -t express1-api .
```

Run the container with Docker Compose:

```bash
docker compose up -d --build
```

The container listens on port 3000.

## Configuration

The server reads the following environment variables:

- `JWT_SECRET` for signing access tokens
- `DB_PATH` for the SQLite database file path
- `PORT` to override the default development port

SQLite data is stored in the Docker volume `express1-data`.

## Notes

- CORS allows local frontend development from `http://localhost:5173` and `http://localhost:3001`, plus `*.proxy.itcollege.ee` hosts.
- The public API is intended to be exercised through a client, such as Postman, Thunder Client, or a frontend app.
