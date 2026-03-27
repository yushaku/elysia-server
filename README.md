# Elysia Server Architecture

This project follows a structured architecture pattern for Elysia applications.

## Project Structure

```
src/
├── app.ts                 # Main application setup and initialization
├── index.ts               # Entry point
├── config/
│   └── env.ts            # Environment configuration
├── middleware/
│   ├── cors.ts           # CORS middleware
│   ├── error-handler.ts  # Global error handling
│   └── logger.ts         # Request logging
├── routes/
│   ├── index.ts          # Route aggregator
│   └── health.ts         # Health check routes
├── controllers/
│   └── example.controller.ts  # Example controller (handles HTTP requests)
├── services/
│   └── example.service.ts     # Example service (business logic)
├── types/
│   └── index.ts          # TypeScript type definitions
└── utils/
    └── response.ts       # Response helper utilities
```

## Architecture Pattern

- **Routes**: Define route groups and prefixes
- **Controllers**: Handle HTTP requests/responses, call services
- **Services**: Contain business logic, data processing
- **Middleware**: Cross-cutting concerns (logging, CORS, error handling)
- **Types**: Shared TypeScript types and interfaces
- **Utils**: Reusable utility functions
- **Config**: Application configuration and environment variables

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run development server:

   ```bash
   pnpm run dev
   ```

3. Key endpoints:
   - `GET /api` - Welcome message
   - `GET /api/health` - Health check
   - `GET /api/openapi` - API docs
   - `GET /api/metrics` - Prometheus metrics

## Monitoring & Logs

This project now includes an observability stack with:

- Structured JSON logs (`pino`)
- Request correlation via `x-request-id`
- Prometheus metrics (`/api/metrics`)
- Loki + Promtail for log aggregation
- Grafana for dashboards

### 1) Start monitoring stack

Run the full stack from project root:

```bash
docker compose up -d --build
```

### 2) Access services

- API: `http://localhost:8080/api`
- Metrics: `http://localhost:8080/api/metrics`
- Prometheus: `http://localhost:9090`
- Loki: `http://localhost:3100`
- Grafana: `http://localhost:3001` (default: `admin` / `admin`)

### 3) Verify metrics

1. Open `http://localhost:8080/api/metrics`
2. Call some API routes (`/api/health`, auth/user endpoints)
3. Check counters/histograms, for example:
   - `http_requests_total`
   - `http_request_duration_seconds`

### 4) Verify logs in Grafana

1. Open Grafana (`http://localhost:3001`)
2. Go to **Explore** and select **Loki** datasource
3. Query logs with:
   - `{container="ely-server"}`
4. Filter by request ID when needed:
   - `{container="ely-server", requestId="YOUR_REQUEST_ID"}`

### 5) Error handling behavior

- API errors use a consistent JSON format:
  - `success: false`
  - `error`
  - `message`
  - `requestId`
- In production, internal 500 details are hidden from responses.
- Full error context is still logged internally for debugging.

### 6) Useful commands

```bash
# Follow app logs
docker compose logs -f app

# Restart monitoring services only
docker compose restart loki promtail prometheus grafana

# Stop all services
docker compose down
```

## Adding New Features

1. Create a service in `services/` for business logic
2. Create a controller in `controllers/` that uses the service
3. Add routes in `routes/` and register the controller
4. Update types in `types/` if needed
