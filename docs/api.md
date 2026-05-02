# API Reference

Base URL (dev): `http://localhost:4000/api`

## Phase 0 — Available Endpoints

### `GET /health`

Returns service health, including database and Redis connectivity.

**Response (200 OK):**

```json
{
  "status": "ok",
  "service": "skillstreak-backend",
  "timestamp": "2026-05-02T12:00:00.000Z",
  "checks": { "database": "up", "redis": "up" }
}
```

**Response (503 Service Unavailable):** same shape with `status: "degraded"` when any dependency is down.

---

More endpoints will be documented as phases ship. See `planning/SKILLSTREAK_AI_PLANNING.md` §13 for the full planned API surface.
