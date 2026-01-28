# AgentIndex API Specification

## Table of Contents
- [Overview](#overview)
- [Endpoints](#endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [CORS & Security](#cors--security)
- [Caching Strategy](#caching-strategy)
- [Data Freshness](#data-freshness)
- [Performance Targets](#performance-targets)
- [Implementation Notes](#implementation-notes)
- [Future Considerations](#future-considerations)

---

## Overview

Next.js API Routes using App Router pattern (`/app/api/*`). All endpoints are public with no authentication required. Data is read-only from SQLite database via Drizzle ORM. No mutations supported from web interface.

**Base URL:** `https://agentindex.com.au/api` (production) or `http://localhost:3000/api` (development)

**Content-Type:** `application/json`

**Cache Strategy:**
- Search endpoints: `Cache-Control: public, max-age=60`
- Profile endpoints: `Cache-Control: public, max-age=3600`

---

## Endpoints

### 1. Universal Search

**`GET /api/search`**

Search across all entity types: agents, agencies, and suburbs. Uses SQLite FTS5 for full-text matching with ranking.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | — | Search query string |
| `type` | string | No | `"all"` | Filter results: `"agent"`, `"agency"`, `"suburb"`, or `"all"` |
| `limit` | number | No | `5` | Max results per type (max: 20) |

#### Request Example

```http
GET /api/search?q=bondi&type=all&limit=5
```

#### Response

```json
{
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "john-smith-bondi",
      "full_name": "John Smith",
      "photo_url": "https://cdn.agentindex.com.au/photos/john-smith.jpg",
      "agency_name": "Ray White Bondi Beach",
      "suburbs": ["Bondi Beach", "North Bondi", "Bondi"],
      "total_sales_count": 45,
      "avg_sale_price": 1250000
    }
  ],
  "agencies": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "slug": "ray-white-bondi-beach",
      "name": "Ray White Bondi Beach",
      "logo_url": "https://cdn.agentindex.com.au/logos/ray-white-bondi.png",
      "agent_count": 12,
      "suburb": "Bondi Beach"
    }
  ],
  "suburbs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "slug": "bondi-beach-nsw-2026",
      "name": "Bondi Beach",
      "state": "NSW",
      "postcode": "2026",
      "agent_count": 117
    }
  ]
}
```

#### Response Fields

**agents[]:**
- `id` — Agent UUID
- `slug` — URL-safe identifier
- `full_name` — Agent's full name
- `photo_url` — Profile photo URL (nullable)
- `agency_name` — Associated agency name
- `suburbs[]` — Primary suburbs served
- `total_sales_count` — Lifetime sales count
- `avg_sale_price` — Average sale price (AUD)

**agencies[]:**
- `id` — Agency UUID
- `slug` — URL-safe identifier
- `name` — Agency name
- `logo_url` — Agency logo URL (nullable)
- `agent_count` — Number of agents
- `suburb` — Primary suburb location

**suburbs[]:**
- `id` — Suburb UUID
- `slug` — URL-safe identifier (includes state and postcode)
- `name` — Suburb name
- `state` — Australian state code
- `postcode` — Postal code
- `agent_count` — Number of active agents

#### Error Responses

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Query parameter 'q' is required"
  }
}
```

---

### 2. Search Autocomplete

**`GET /api/search/autocomplete`**

Fast autocomplete suggestions for search input. Optimized for low latency with prefix matching.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | Yes | — | Partial search string (min 2 characters) |
| `limit` | number | No | `8` | Max suggestions returned |

#### Request Example

```http
GET /api/search/autocomplete?q=bon&limit=8
```

#### Response

```json
{
  "suggestions": [
    {
      "type": "agent",
      "label": "John Smith — Ray White Bondi Beach",
      "slug": "/agent/john-smith-bondi"
    },
    {
      "type": "suburb",
      "label": "Bondi Beach, NSW 2026",
      "slug": "/agents/nsw/bondi-beach-nsw-2026"
    },
    {
      "type": "agency",
      "label": "Ray White Bondi Beach",
      "slug": "/agency/ray-white-bondi-beach"
    },
    {
      "type": "agent",
      "label": "Sarah Bonetti — McGrath Estate Agents",
      "slug": "/agent/sarah-bonetti-mosman"
    }
  ]
}
```

#### Response Fields

**suggestions[]:**
- `type` — Entity type: `"agent"`, `"agency"`, or `"suburb"`
- `label` — Display text for suggestion
- `slug` — Relative URL path

#### Error Responses

```json
{
  "error": {
    "code": "QUERY_TOO_SHORT",
    "message": "Query must be at least 2 characters"
  }
}
```

---

### 3. List Agents

**`GET /api/agents`**

Retrieve filtered and sorted list of agents with pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `suburb` | string | No | — | Filter by suburb slug |
| `agency` | string | No | — | Filter by agency slug |
| `state` | string | No | — | Filter by state (NSW, VIC, QLD, SA, WA, TAS, NT, ACT) |
| `sort` | string | No | `"sales_count"` | Sort: `"sales_count"`, `"avg_price"`, or `"name"` |
| `property_type` | string | No | — | Filter: `"house"`, `"apartment"`, `"townhouse"`, `"land"` |
| `page` | number | No | `1` | Page number for pagination |
| `limit` | number | No | `20` | Results per page (max: 50) |

#### Request Example

```http
GET /api/agents?suburb=bondi-beach-nsw-2026&sort=sales_count&page=1&limit=20
```

#### Response

```json
{
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "john-smith-bondi",
      "full_name": "John Smith",
      "photo_url": "https://cdn.agentindex.com.au/photos/john-smith.jpg",
      "agency_id": "660e8400-e29b-41d4-a716-446655440001",
      "agency_name": "Ray White Bondi Beach",
      "agency_logo_url": "https://cdn.agentindex.com.au/logos/ray-white-bondi.png",
      "primary_suburb": "Bondi Beach",
      "state": "NSW",
      "total_sales_count": 45,
      "avg_sale_price": 1250000,
      "min_sale_price": 780000,
      "max_sale_price": 2100000,
      "sales_last_12_months": 12,
      "avg_rating": 4.7,
      "review_count": 23
    }
  ],
  "total": 117,
  "page": 1,
  "pages": 6,
  "suburb": {
    "name": "Bondi Beach",
    "state": "NSW",
    "postcode": "2026",
    "median_price": 1120000,
    "price_change_yoy": 5.2,
    "sales_volume_12m": 342
  }
}
```

#### Response Fields

**agents[]:** Array of agent objects (see fields above)

**Metadata:**
- `total` — Total matching agents
- `page` — Current page number
- `pages` — Total pages available

**suburb:** (included when filtering by suburb)
- `name` — Suburb name
- `state` — State code
- `postcode` — Postal code
- `median_price` — Median sale price (AUD)
- `price_change_yoy` — Year-over-year percentage change
- `sales_volume_12m` — Total sales in last 12 months

#### Error Responses

```json
{
  "error": {
    "code": "INVALID_SORT",
    "message": "Sort parameter must be 'sales_count', 'avg_price', or 'name'"
  }
}
```

---

### 4. Agent Profile

**`GET /api/agent/[slug]`**

Retrieve complete profile data for a specific agent.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Agent slug identifier |

#### Request Example

```http
GET /api/agent/john-smith-bondi
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "john-smith-bondi",
  "full_name": "John Smith",
  "first_name": "John",
  "last_name": "Smith",
  "photo_url": "https://cdn.agentindex.com.au/photos/john-smith.jpg",
  "email": "john.smith@raywhite.com",
  "phone": "+61 2 9130 2222",
  "mobile": "+61 412 345 678",
  "bio": "Award-winning agent with 15+ years experience in the Eastern Suburbs market...",
  "languages": ["English", "Mandarin"],
  "specializations": ["Prestige Property", "Waterfront Homes", "Investment"],

  "agency": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "slug": "ray-white-bondi-beach",
    "name": "Ray White Bondi Beach",
    "logo_url": "https://cdn.agentindex.com.au/logos/ray-white-bondi.png",
    "address": "123 Campbell Parade, Bondi Beach NSW 2026",
    "phone": "+61 2 9130 2222",
    "website": "https://www.raywhite.com/bondibeach"
  },

  "suburbs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "slug": "bondi-beach-nsw-2026",
      "name": "Bondi Beach",
      "state": "NSW",
      "postcode": "2026",
      "sales_count": 28
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "slug": "north-bondi-nsw-2026",
      "name": "North Bondi",
      "state": "NSW",
      "postcode": "2026",
      "sales_count": 12
    }
  ],

  "stats": {
    "total_sales_count": 45,
    "avg_sale_price": 1250000,
    "min_sale_price": 780000,
    "max_sale_price": 2100000,
    "median_sale_price": 1180000,
    "sales_last_12_months": 12,
    "sales_last_6_months": 7,
    "avg_days_on_market": 32,
    "avg_rating": 4.7,
    "review_count": 23
  },

  "recent_sales": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "address": "45 Ramsgate Avenue, Bondi Beach",
      "suburb": "Bondi Beach",
      "state": "NSW",
      "postcode": "2026",
      "property_type": "house",
      "bedrooms": 4,
      "bathrooms": 3,
      "parking": 2,
      "sale_price": 2100000,
      "sale_date": "2024-11-15",
      "days_on_market": 28,
      "sale_method": "auction"
    }
  ],

  "reviews": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440005",
      "reviewer_name": "Michael T.",
      "rating": 5,
      "comment": "John was exceptional throughout the entire process...",
      "property_address": "45 Ramsgate Avenue, Bondi Beach",
      "sale_price": 2100000,
      "review_date": "2024-11-20",
      "verified": true
    }
  ]
}
```

#### Error Responses

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Agent not found"
  }
}
```

---

### 5. Agency Profile

**`GET /api/agency/[slug]`**

Retrieve complete profile data for a specific agency.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Agency slug identifier |

#### Request Example

```http
GET /api/agency/ray-white-bondi-beach
```

#### Response

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "slug": "ray-white-bondi-beach",
  "name": "Ray White Bondi Beach",
  "logo_url": "https://cdn.agentindex.com.au/logos/ray-white-bondi.png",
  "brand": "Ray White",
  "address": "123 Campbell Parade, Bondi Beach NSW 2026",
  "suburb": "Bondi Beach",
  "state": "NSW",
  "postcode": "2026",
  "phone": "+61 2 9130 2222",
  "email": "bondibeach@raywhite.com",
  "website": "https://www.raywhite.com/bondibeach",
  "description": "Ray White Bondi Beach has been serving the Eastern Suburbs for over 30 years...",
  "established_year": 1992,

  "stats": {
    "agent_count": 12,
    "total_sales_count": 456,
    "avg_sale_price": 1380000,
    "sales_last_12_months": 89,
    "market_share_suburb": 24.5
  },

  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "john-smith-bondi",
      "full_name": "John Smith",
      "photo_url": "https://cdn.agentindex.com.au/photos/john-smith.jpg",
      "total_sales_count": 45,
      "avg_sale_price": 1250000,
      "avg_rating": 4.7
    }
  ],

  "recent_sales": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "address": "45 Ramsgate Avenue, Bondi Beach",
      "suburb": "Bondi Beach",
      "property_type": "house",
      "bedrooms": 4,
      "bathrooms": 3,
      "sale_price": 2100000,
      "sale_date": "2024-11-15",
      "agent_id": "550e8400-e29b-41d4-a716-446655440000",
      "agent_name": "John Smith"
    }
  ]
}
```

#### Error Responses

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Agency not found"
  }
}
```

---

### 6. Suburb Profile

**`GET /api/suburb/[slug]`**

Retrieve suburb data with market statistics and agent listings.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Suburb slug identifier (format: `name-state-postcode`) |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | `1` | Page number for agent pagination |
| `limit` | number | No | `20` | Agents per page (max: 50) |
| `sort` | string | No | `"sales_count"` | Sort: `"sales_count"`, `"avg_price"`, `"name"` |

#### Request Example

```http
GET /api/suburb/bondi-beach-nsw-2026?page=1&limit=20&sort=sales_count
```

#### Response

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "slug": "bondi-beach-nsw-2026",
  "name": "Bondi Beach",
  "state": "NSW",
  "postcode": "2026",
  "lat": -33.8915,
  "lng": 151.2767,

  "market_stats": {
    "median_price": 1120000,
    "median_price_house": 2300000,
    "median_price_apartment": 950000,
    "price_change_yoy": 5.2,
    "sales_volume_12m": 342,
    "avg_days_on_market": 35,
    "clearance_rate": 76.5,
    "rental_yield": 2.8
  },

  "demographics": {
    "population": 12450,
    "median_age": 34,
    "median_household_income": 98000
  },

  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "john-smith-bondi",
      "full_name": "John Smith",
      "photo_url": "https://cdn.agentindex.com.au/photos/john-smith.jpg",
      "agency_name": "Ray White Bondi Beach",
      "agency_logo_url": "https://cdn.agentindex.com.au/logos/ray-white-bondi.png",
      "sales_count_suburb": 28,
      "avg_sale_price_suburb": 1350000,
      "total_sales_count": 45,
      "avg_rating": 4.7
    }
  ],

  "total_agents": 117,
  "page": 1,
  "pages": 6
}
```

#### Error Responses

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Suburb not found"
  }
}
```

---

### 7. Voice Agent Signed URL

**`POST /api/voice/signed-url`**

Generate a signed WebSocket URL for ElevenLabs Conversational AI. Keeps API key server-side. Sets dynamic variables and overrides based on context.

#### Request Body

```json
{
  "pageType": "agent",
  "agentSlug": "john-smith-bondi",
  "voiceMode": "navigator"
}
```

#### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pageType` | string | Yes | Context: `"agent"`, `"agency"`, `"suburb"`, `"home"` |
| `agentSlug` | string | Conditional | Required if `pageType` is `"agent"` |
| `agencySlug` | string | Conditional | Required if `pageType` is `"agency"` |
| `suburbSlug` | string | Conditional | Required if `pageType` is `"suburb"` |
| `voiceMode` | string | Yes | Mode: `"navigator"` or `"assistant"` |

#### Request Example

```http
POST /api/voice/signed-url
Content-Type: application/json

{
  "pageType": "agent",
  "agentSlug": "john-smith-bondi",
  "voiceMode": "navigator"
}
```

#### Response

```json
{
  "signedUrl": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=abc123&signed_url=xyz789",
  "sessionId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "expiresAt": "2024-12-15T10:45:00Z"
}
```

#### Response Fields

- `signedUrl` — WebSocket URL with embedded signature (valid 5 minutes)
- `sessionId` — UUID for tracking conversation session
- `expiresAt` — ISO 8601 timestamp of URL expiration

#### Voice Mode Configuration

**navigator mode:**
- Purpose: Helps user explore page content
- Variables: Full agent/agency/suburb data injected
- Prompts: Navigation assistance, data explanation

**assistant mode:**
- Purpose: General Q&A about real estate
- Variables: Minimal context
- Prompts: Real estate advice, market insights

#### Error Responses

```json
{
  "error": {
    "code": "MISSING_SLUG",
    "message": "agentSlug is required when pageType is 'agent'"
  }
}
```

```json
{
  "error": {
    "code": "ELEVENLABS_ERROR",
    "message": "Failed to generate signed URL from ElevenLabs API"
  }
}
```

---

## Error Handling

All API errors follow consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid parameters or malformed request |
| `404` | Not Found | Resource does not exist |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_QUERY` | 400 | Missing or invalid query parameter |
| `QUERY_TOO_SHORT` | 400 | Search query below minimum length |
| `INVALID_SORT` | 400 | Unsupported sort parameter |
| `INVALID_PAGE` | 400 | Page number out of range |
| `NOT_FOUND` | 404 | Requested entity does not exist |
| `MISSING_SLUG` | 400 | Required slug parameter missing |
| `ELEVENLABS_ERROR` | 500 | External API failure |
| `DATABASE_ERROR` | 500 | Database query failed |

---

## Rate Limiting

- **Strategy:** IP-based rate limiting via Vercel Edge Config (future implementation)
- **Current:** No explicit rate limits; relies on Vercel DDoS protection
- **Planned Limits:**
  - Search endpoints: 60 requests/minute per IP
  - Profile endpoints: 120 requests/minute per IP
  - Voice signed URL: 10 requests/minute per IP

Exceeded rate limits return `429 Too Many Requests`:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

---

## CORS & Security

- **CORS:** Not required (same-origin requests only)
- **Authentication:** None (all endpoints public)
- **HTTPS:** Enforced in production
- **Input Validation:** All query params sanitized
- **SQL Injection:** Protected via Drizzle ORM parameterization
- **XSS Prevention:** All outputs escaped in frontend

---

## Caching Strategy

### Cache-Control Headers

| Endpoint | Cache Duration | Rationale |
|----------|----------------|-----------|
| `/api/search` | 60 seconds | Data changes frequently with new searches |
| `/api/search/autocomplete` | 60 seconds | Real-time user input needs fresh results |
| `/api/agents` | 300 seconds | Filtered lists update moderately |
| `/api/agent/[slug]` | 3600 seconds | Agent profiles change infrequently |
| `/api/agency/[slug]` | 3600 seconds | Agency data stable |
| `/api/suburb/[slug]` | 3600 seconds | Market stats update daily |
| `/api/voice/signed-url` | No cache | Dynamic signed URLs expire quickly |

### CDN Caching

Static pages (SSG) cached at Vercel CDN edge indefinitely with on-demand revalidation.

---

## Data Freshness

- **Database Updates:** Daily sync from external data sources
- **Revalidation:** ISR (Incremental Static Regeneration) triggers on data updates
- **Real-time Requirements:** None (acceptable 1-hour staleness for profile data)

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Search latency (p95) | < 200ms | TBD |
| Profile load (p95) | < 150ms | TBD |
| Autocomplete (p95) | < 100ms | TBD |
| DB query time (p95) | < 50ms | TBD |

---

## Implementation Notes

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Database:** SQLite with FTS5 extension
- **ORM:** Drizzle ORM
- **Hosting:** Vercel
- **Voice API:** ElevenLabs Conversational AI

### Database Indexes

Critical indexes for performance:
- FTS5 index on `agents(full_name, bio)`
- FTS5 index on `agencies(name, description)`
- FTS5 index on `suburbs(name)`
- Composite index on `sales(agent_id, sale_date)`
- Index on `agent_suburbs(suburb_id, sales_count)`

### File Structure

```
/app/api/
├── search/
│   ├── route.ts           # GET /api/search
│   └── autocomplete/
│       └── route.ts       # GET /api/search/autocomplete
├── agents/
│   └── route.ts           # GET /api/agents
├── agent/
│   └── [slug]/
│       └── route.ts       # GET /api/agent/[slug]
├── agency/
│   └── [slug]/
│       └── route.ts       # GET /api/agency/[slug]
├── suburb/
│   └── [slug]/
│       └── route.ts       # GET /api/suburb/[slug]
└── voice/
    └── signed-url/
        └── route.ts       # POST /api/voice/signed-url
```

---

## Future Considerations

### Planned Features
- Agent comparison endpoint (`POST /api/agents/compare`)
- Saved searches (requires auth)
- Email alerts for new listings (requires auth)
- Agent contact form submission (`POST /api/agent/[slug]/contact`)

### Scalability
- Consider read replicas if read load exceeds 1000 req/s
- Implement Redis cache layer for hot queries
- Add GraphQL API for flexible client queries
- WebSocket endpoint for real-time market updates
