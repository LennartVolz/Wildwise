# Wildwise

Wildwise is a small, responsive full-stack app for discovering animal facts. Search by animal name to see its scientific name, habitat, diet, range, lifespan, and other available details.

Animal data comes from the [API Ninjas Animals API](https://api-ninjas.com/api/animals). The API key is used only by the server and is never sent to the browser.

## Requirements

- Node.js 22 or newer for local development
- Docker and Docker Compose to run the container
- An API key from [API Ninjas](https://api-ninjas.com/register)

## Run locally

Create a local environment file from the example and add your API key:

```sh
cp .env.example .env
```

Edit `.env`:

```dotenv
API_NINJAS_KEY=your-api-key
```

Start the server:

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). The server reads `.env` automatically.

## Run with Docker Compose

Create and configure `.env` as shown above, then run:

```sh
docker compose up --build
```

The local Compose service uses the host network so it can use the host's DNS resolver to reach API Ninjas. Open [http://localhost:3000](http://localhost:3000). To use another local port, set `PORT`:

```sh
PORT=8080 docker compose up --build
```

Stop the service with `docker compose down`.

## Deploy

### Render

The repository includes a [`render.yaml`](render.yaml) Blueprint for deploying the Docker app to Render:

1. Push this repository to a Git provider connected to Render.
2. In the Render dashboard, create a new **Blueprint** and select the repository.
3. Add your API Ninjas key as the `API_NINJAS_KEY` environment variable when prompted.
4. Deploy the Blueprint. Render builds the included `Dockerfile` and uses `/healthz` for health checks.

The API key is a secret: configure it in the hosting provider's environment settings, not in source control. The app listens on the `PORT` environment variable supplied by the hosting platform (default `3000`).

### Other container platforms

Build and run the included Docker image on a platform that supports Docker containers:

```sh
docker build -t wildwise .
docker run --rm -p 3000:3000 \
  -e API_NINJAS_KEY=your-api-key \
  -e PORT=3000 \
  wildwise
```

Configure `API_NINJAS_KEY` as a secret and expose the port configured by `PORT`. The image includes a Docker health check that requests `/healthz`.

## HTTP API

```http
GET /api/animal?q=lion
```

Successful responses include `title`, `description` (the scientific name when available), `facts` (an array of `{ "label", "value" }` objects), and `articleUrl`. Invalid input, missing animals, missing or invalid credentials, and upstream API failures return an appropriate HTTP status and a JSON error message.

The health endpoint returns `{"status":"ok"}`:

```http
GET /healthz
```

## Data source

Animal facts are provided by [API Ninjas](https://api-ninjas.com/api/animals). Results depend on API Ninjas availability, the configured API key, and its request quota. The API can return up to ten matches; Wildwise prefers an exact name match and otherwise shows the first result.
