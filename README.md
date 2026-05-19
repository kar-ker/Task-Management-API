# Express.js Backend

This project is an Express.js + TypeScript backend. It uses SQLite for persistence, JWT access tokens, refresh tokens, and protected CRUD endpoints.

- **Production backend**: https://kerkaa-express.proxy.itcollege.ee

## Local development

Install dependencies and run the server:

```bash
npm install
npm run dev
```

The API runs on `http://localhost:3001` by default in development.

## Build and test

```bash
npm run build
npm test
```

## Docker

Build the image:

```bash
docker build -t express1-api .
```

Run the container with a local volume for SQLite data:

```bash
docker compose up -d --build
```

The container listens on port `3000`.

## GitLab CI deploy to a VPS

The repository includes a `.gitlab-ci.yml` that:

1. Runs `npm ci`, `npm test`, and `npm run build` on merge requests and `main`.
2. Builds the backend image in the pipeline.
3. SSHes into your VPS on `main` and runs `docker compose` there.

### Required GitLab CI variables

Set these variables in your GitLab project:

```text
SSH_PRIVATE_KEY
SSH_KNOWN_HOSTS
SSH_USER
SSH_HOST
SSH_APP_DIR
```

### VPS prerequisites

Make sure the VPS has:

- Docker installed
- Docker Compose installed
- A checkout of this repository at the path in `SSH_APP_DIR`
- A `.env` file or exported environment variables containing at least `JWT_SECRET`

### Example deployment flow

When you push to `main`, GitLab will connect to the VPS over SSH and run:

```bash
docker compose -p express1 up -d --remove-orphans --build --force-recreate
```

That rebuilds the backend container and restarts it in place.

## Notes

- SQLite data is stored in the Docker volume named `express1-data`.
- The runtime container expects `JWT_SECRET` to be provided.
- CORS defaults to `http://localhost:5173` unless you override `CORS_ORIGIN`.
