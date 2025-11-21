# WhatsApp Command Center - Enterprise Architecture

## 1. ASSUMPTIONS

### Business Assumptions
- Target: SMBs with 1-1000 employees
- Expected load: 100K-10M messages/day per instance
- Multi-tenancy required for cloud version
- Self-hosted must work on single server (minimum 4GB RAM, 2 CPU)
- Real-time requirements: <500ms message delivery
- AI response time: <3s for simple queries, <10s for complex
- 99.9% uptime SLA for enterprise tier

### Technical Assumptions
- WhatsApp Web.js as core WhatsApp integration
- Users have modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Node.js 18+ available
- PostgreSQL 14+ for primary database
- Redis 6+ for caching and queues
- Object storage available (S3 or compatible)
- SMTP server for email notifications
- Webhook targets respond within 30s

### Security Assumptions
- End-to-end encryption at WhatsApp layer (handled by WhatsApp)
- Application-level encryption for sensitive data (AES-256)
- API authentication via JWT tokens
- Rate limiting at API gateway level
- RBAC (Role-Based Access Control) for team members
- Audit logs for compliance (GDPR, SOC2)

### Scalability Assumptions
- Horizontal scaling for API servers (stateless)
- Vertical scaling for WhatsApp clients (1 client = 1 instance initially)
- Message queue for async processing
- CDN for static assets
- Database read replicas for analytics

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile PWA  │  │   API Docs   │      │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Swagger)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Load Balancer (nginx/Traefik)                       │   │
│  │  - SSL Termination                                   │   │
│  │  - Rate Limiting                                     │   │
│  │  - Request Routing                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   API Services   │ │  WS Gateway  │ │ Static Files │
│   (NestJS)       │ │ (Socket.IO)  │ │    (CDN)     │
│  - REST APIs     │ │ - Real-time  │ │  - Assets    │
│  - GraphQL       │ │ - Presence   │ │  - Uploads   │
└──────────────────┘ └──────────────┘ └──────────────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │   Auth     │ │   Team     │ │    CRM     │ │   Auto   │ │
│  │  Service   │ │  Service   │ │  Service   │ │ mation   │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │    AI      │ │ Analytics  │ │ Broadcast  │ │Webhook   │ │
│  │  Service   │ │  Service   │ │  Service   │ │Service   │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  WhatsApp Layer  │ │  AI Gateway  │ │Message Queue │
│                  │ │              │ │              │
│ ┌──────────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │
│ │  WA Client   │ │ │ │  OpenAI  │ │ │ │  Bull    │ │
│ │  Manager     │ │ │ │  Router  │ │ │ │  Queue   │ │
│ │              │ │ │ │          │ │ │ │ (Redis)  │ │
│ │ - Session    │ │ │ │- OpenAI  │ │ │ │          │ │
│ │ - Events     │ │ │ │- Anthropic│ │ │ │- Jobs    │ │
│ │ - Messages   │ │ │ │- Gemini  │ │ │ │- Workers │ │
│ │              │ │ │ │- Custom  │ │ │ │- Retries │ │
│ └──────────────┘ │ │ └──────────┘ │ │ └──────────┘ │
└──────────────────┘ └──────────────┘ └──────────────┘
         │                  │                 │
         └──────────────────┼─────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │PostgreSQL  │ │   Redis    │ │    S3      │ │  Logs    │ │
│  │            │ │            │ │            │ │          │ │
│  │- Primary   │ │- Cache     │ │- Media     │ │- Winston │ │
│  │- Replicas  │ │- Sessions  │ │- Files     │ │- ELK     │ │
│  │- Backup    │ │- Pub/Sub   │ │- Exports   │ │- Metrics │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Design Patterns & Principles

#### SOLID Principles
- **S**ingle Responsibility: Each service handles one domain
- **O**pen/Closed: Extensible via plugins/interfaces
- **L**iskov Substitution: AI providers implement same interface
- **I**nterface Segregation: Clients only depend on needed methods
- **D**ependency Inversion: Depend on abstractions, not concretions

#### Architectural Patterns
- **Microservices**: Modular services with clear boundaries
- **Event-Driven**: Async communication via message queues
- **CQRS**: Command/Query separation for analytics
- **Repository Pattern**: Abstract data access layer
- **Factory Pattern**: Create AI providers dynamically
- **Strategy Pattern**: Swap AI models/automation rules
- **Observer Pattern**: Real-time event notifications
- **Circuit Breaker**: Fault tolerance for external APIs

#### Clean Architecture Layers
```
┌─────────────────────────────────────┐
│      Presentation Layer              │ ← Controllers, DTOs, Validators
├─────────────────────────────────────┤
│      Application Layer               │ ← Use Cases, Business Logic
├─────────────────────────────────────┤
│      Domain Layer                    │ ← Entities, Value Objects
├─────────────────────────────────────┤
│      Infrastructure Layer            │ ← DB, External APIs, Queues
└─────────────────────────────────────┘
```

---

## 3. TECHNOLOGY STACK

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **UI Library**: React 18
- **Styling**: TailwindCSS 3.4 + shadcn/ui
- **State Management**: Zustand + React Query
- **Real-time**: Socket.IO Client
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts / ApexCharts
- **Drag & Drop**: dnd-kit (for automation builder)
- **Rich Text**: Lexical / Tiptap
- **Notifications**: Sonner

### Backend
- **Framework**: NestJS 10 (TypeScript)
- **Runtime**: Node.js 20 LTS
- **API Style**: REST + GraphQL (optional)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Authentication**: Passport.js (JWT, OAuth)
- **Authorization**: CASL (permissions)
- **Logging**: Winston + Morgan
- **Monitoring**: Prometheus + Grafana

### Database & Cache
- **Primary DB**: PostgreSQL 15+
- **ORM**: Prisma 5
- **Cache**: Redis 7
- **Search**: PostgreSQL Full-Text (or Elasticsearch for scale)
- **Message Queue**: Bull (Redis-backed)
- **File Storage**: AWS S3 / MinIO

### WhatsApp Integration
- **Library**: whatsapp-web.js (current)
- **Session**: LocalAuth / RemoteAuth
- **Browser**: Puppeteer

### AI Integration
- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus/Sonnet/Haiku
- **Google**: Gemini 1.5 Pro/Flash
- **Custom**: REST API adapter (OpenAI-compatible)
- **Orchestration**: LangChain / Custom

### DevOps
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional, for scale)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Prometheus, Grafana
- **Logging**: Winston → ELK Stack
- **Reverse Proxy**: nginx / Traefik

---

## 4. DATABASE SCHEMA

### Core Entities

```prisma
// Users & Authentication
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(AGENT)
  organizationId String
  organization  Organization @relation(fields: [organizationId])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  assignedChats ConversationAssignment[]
  notes         Note[]
  activityLogs  ActivityLog[]
}

enum Role {
  OWNER
  ADMIN
  MANAGER
  AGENT
  VIEWER
}

// Organization (Multi-tenancy)
model Organization {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  plan            Plan     @default(FREE)
  whatsappSessions WhatsAppSession[]
  users           User[]
  contacts        Contact[]
  conversations   Conversation[]
  tags            Tag[]
  customFields    CustomField[]
  automations     Automation[]
  broadcasts      Broadcast[]
  apiKeys         ApiKey[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

// WhatsApp Sessions
model WhatsAppSession {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  name            String
  phoneNumber     String?
  status          SessionStatus @default(DISCONNECTED)
  qrCode          String?
  lastSeen        DateTime?
  clientInfo      Json?
  settings        Json? // AI config, auto-reply settings
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  conversations   Conversation[]
  messages        Message[]
}

enum SessionStatus {
  CONNECTED
  DISCONNECTED
  QR_READY
  LOADING
  FAILED
}

// Contacts (CRM)
model Contact {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  whatsappId      String   // phone@c.us format
  name            String?
  phoneNumber     String
  email           String?
  profilePicUrl   String?
  isBlocked       Boolean  @default(false)
  language        String?
  timezone        String?
  customFields    Json?    // Flexible key-value store
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastMessageAt   DateTime?

  // Relations
  conversations   Conversation[]
  tags            ContactTag[]
  segments        ContactSegment[]

  @@unique([organizationId, whatsappId])
  @@index([organizationId, phoneNumber])
}

// Conversations (Inbox)
model Conversation {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  sessionId       String
  session         WhatsAppSession @relation(fields: [sessionId])
  contactId       String
  contact         Contact  @relation(fields: [contactId])
  status          ConversationStatus @default(OPEN)
  priority        Priority @default(NORMAL)
  channel         String   @default("whatsapp")
  lastMessageAt   DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  messages        Message[]
  assignments     ConversationAssignment[]
  notes           Note[]
  tags            ConversationTag[]

  @@index([organizationId, status, lastMessageAt])
  @@index([sessionId, contactId])
}

enum ConversationStatus {
  OPEN
  PENDING
  RESOLVED
  CLOSED
  SPAM
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

// Messages
model Message {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId])
  sessionId       String
  session         WhatsAppSession @relation(fields: [sessionId])
  whatsappMessageId String @unique
  direction       MessageDirection
  type            MessageType
  body            String?
  mediaUrl        String?
  mediaMimeType   String?
  metadata        Json?    // Reactions, mentions, quotes, etc.
  status          MessageStatus @default(PENDING)
  ackStatus       Int?     // WhatsApp ack: -1 to 4
  timestamp       DateTime
  createdAt       DateTime @default(now())

  // AI-related
  isAiGenerated   Boolean  @default(false)
  aiProvider      String?  // openai, anthropic, gemini, custom
  aiModel         String?
  aiPromptTokens  Int?
  aiCompletionTokens Int?

  @@index([conversationId, timestamp])
  @@index([sessionId, timestamp])
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  STICKER
  LOCATION
  CONTACT
  POLL
  REACTION
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

// Team Inbox - Assignments
model ConversationAssignment {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId])
  userId          String
  user            User     @relation(fields: [userId])
  assignedAt      DateTime @default(now())
  assignedBy      String?

  @@unique([conversationId, userId])
}

// Internal Notes
model Note {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId])
  userId          String
  user            User     @relation(fields: [userId])
  content         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([conversationId, createdAt])
}

// Tags
model Tag {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  name            String
  color           String
  createdAt       DateTime @default(now())

  // Relations
  contacts        ContactTag[]
  conversations   ConversationTag[]

  @@unique([organizationId, name])
}

model ContactTag {
  contactId       String
  contact         Contact  @relation(fields: [contactId])
  tagId           String
  tag             Tag      @relation(fields: [tagId])

  @@id([contactId, tagId])
}

model ConversationTag {
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId])
  tagId           String
  tag             Tag      @relation(fields: [tagId])

  @@id([conversationId, tagId])
}

// Custom Fields (CRM)
model CustomField {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  name            String
  key             String
  type            FieldType
  options         Json?    // For SELECT type
  required        Boolean  @default(false)
  createdAt       DateTime @default(now())

  @@unique([organizationId, key])
}

enum FieldType {
  TEXT
  NUMBER
  EMAIL
  PHONE
  DATE
  SELECT
  MULTISELECT
  URL
}

// Segments (for targeted broadcasts)
model Segment {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  conditions      Json     // Filter rules
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  contacts        ContactSegment[]
  broadcasts      Broadcast[]
}

model ContactSegment {
  contactId       String
  contact         Contact  @relation(fields: [contactId])
  segmentId       String
  segment         Segment  @relation(fields: [segmentId])

  @@id([contactId, segmentId])
}

// Automation (No-Code Builder)
model Automation {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  name            String
  description     String?
  enabled         Boolean  @default(true)
  trigger         Json     // Trigger configuration
  actions         Json     // Action steps (flow)
  conditions      Json?    // Optional conditions
  stats           Json?    // Execution stats
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  executions      AutomationExecution[]

  @@index([organizationId, enabled])
}

model AutomationExecution {
  id              String   @id @default(cuid())
  automationId    String
  automation      Automation @relation(fields: [automationId])
  contactId       String?
  conversationId  String?
  status          ExecutionStatus
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  error           String?
  logs            Json?

  @@index([automationId, startedAt])
}

enum ExecutionStatus {
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

// AI Configuration
model AiProvider {
  id              String   @id @default(cuid())
  organizationId  String
  provider        AiProviderType
  enabled         Boolean  @default(true)
  apiKey          String   @encrypted
  model           String
  config          Json?    // Temperature, max_tokens, etc.
  priority        Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([organizationId, provider])
}

enum AiProviderType {
  OPENAI
  ANTHROPIC
  GEMINI
  CUSTOM
}

model AiKnowledgeBase {
  id              String   @id @default(cuid())
  organizationId  String
  title           String
  content         String
  category        String?
  tags            String[]
  embeddings      Json?    // Vector embeddings for RAG
  priority        Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([organizationId, category])
}

// Broadcasts & Campaigns
model Broadcast {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  name            String
  message         String
  mediaUrl        String?
  segmentId       String?
  segment         Segment? @relation(fields: [segmentId])
  scheduledFor    DateTime?
  status          BroadcastStatus @default(DRAFT)
  stats           Json?    // Sent, delivered, read, failed
  createdAt       DateTime @default(now())
  sentAt          DateTime?

  // Relations
  recipients      BroadcastRecipient[]

  @@index([organizationId, status, scheduledFor])
}

enum BroadcastStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  FAILED
  CANCELLED
}

model BroadcastRecipient {
  id              String   @id @default(cuid())
  broadcastId     String
  broadcast       Broadcast @relation(fields: [broadcastId])
  contactId       String
  status          RecipientStatus @default(PENDING)
  sentAt          DateTime?
  deliveredAt     DateTime?
  readAt          DateTime?
  error           String?

  @@index([broadcastId, status])
}

enum RecipientStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

// Webhooks & Integrations
model Webhook {
  id              String   @id @default(cuid())
  organizationId  String
  name            String
  url             String
  events          String[] // message.received, conversation.closed, etc.
  secret          String?
  enabled         Boolean  @default(true)
  retryConfig     Json?
  createdAt       DateTime @default(now())

  // Relations
  deliveries      WebhookDelivery[]
}

model WebhookDelivery {
  id              String   @id @default(cuid())
  webhookId       String
  webhook         Webhook  @relation(fields: [webhookId])
  event           String
  payload         Json
  response        Json?
  statusCode      Int?
  attempts        Int      @default(0)
  status          DeliveryStatus @default(PENDING)
  createdAt       DateTime @default(now())
  deliveredAt     DateTime?

  @@index([webhookId, status, createdAt])
}

enum DeliveryStatus {
  PENDING
  SUCCESS
  FAILED
  RETRYING
}

// Analytics
model AnalyticsEvent {
  id              String   @id @default(cuid())
  organizationId  String
  sessionId       String?
  userId          String?
  eventType       String
  eventData       Json
  timestamp       DateTime @default(now())

  @@index([organizationId, eventType, timestamp])
}

// API Keys (for external access)
model ApiKey {
  id              String   @id @default(cuid())
  organizationId  String
  organization    Organization @relation(fields: [organizationId])
  name            String
  key             String   @unique
  permissions     String[] // read:messages, write:messages, etc.
  lastUsedAt      DateTime?
  expiresAt       DateTime?
  createdAt       DateTime @default(now())

  @@index([organizationId])
}

// Activity Logs (Audit)
model ActivityLog {
  id              String   @id @default(cuid())
  organizationId  String
  userId          String?
  user            User?    @relation(fields: [userId])
  action          String
  resource        String
  resourceId      String?
  metadata        Json?
  ipAddress       String?
  userAgent       String?
  timestamp       DateTime @default(now())

  @@index([organizationId, timestamp])
  @@index([userId, timestamp])
}
```

### Indexes & Performance Considerations

1. **Composite Indexes**: Frequently queried combinations
2. **Partial Indexes**: For filtered queries (e.g., status = OPEN)
3. **GIN Indexes**: For JSONB fields (metadata, customFields)
4. **Full-Text Search**: PostgreSQL ts_vector for message search
5. **Partitioning**: Messages table by month (for scale)
6. **Archiving**: Move old conversations to archive tables

---

## 5. API DESIGN

### 5.1 REST API Structure

```
Base URL: /api/v1

Authentication:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/logout
  POST   /auth/refresh
  GET    /auth/me

Organizations:
  GET    /organizations
  POST   /organizations
  GET    /organizations/:id
  PATCH  /organizations/:id
  DELETE /organizations/:id

Users (Team):
  GET    /organizations/:orgId/users
  POST   /organizations/:orgId/users
  GET    /organizations/:orgId/users/:userId
  PATCH  /organizations/:orgId/users/:userId
  DELETE /organizations/:orgId/users/:userId

WhatsApp Sessions:
  GET    /whatsapp/sessions
  POST   /whatsapp/sessions
  GET    /whatsapp/sessions/:id
  GET    /whatsapp/sessions/:id/qr
  POST   /whatsapp/sessions/:id/connect
  POST   /whatsapp/sessions/:id/disconnect
  DELETE /whatsapp/sessions/:id

Contacts (CRM):
  GET    /contacts
  POST   /contacts
  GET    /contacts/:id
  PATCH  /contacts/:id
  DELETE /contacts/:id
  POST   /contacts/:id/tags
  DELETE /contacts/:id/tags/:tagId
  GET    /contacts/:id/conversations
  POST   /contacts/import
  GET    /contacts/export

Conversations (Inbox):
  GET    /conversations
  GET    /conversations/:id
  PATCH  /conversations/:id
  POST   /conversations/:id/assign
  POST   /conversations/:id/notes
  POST   /conversations/:id/tags
  GET    /conversations/:id/messages

Messages:
  GET    /conversations/:id/messages
  POST   /conversations/:id/messages
  GET    /messages/:id
  DELETE /messages/:id (revoke)

Tags:
  GET    /tags
  POST   /tags
  PATCH  /tags/:id
  DELETE /tags/:id

Automations:
  GET    /automations
  POST   /automations
  GET    /automations/:id
  PATCH  /automations/:id
  DELETE /automations/:id
  POST   /automations/:id/toggle
  GET    /automations/:id/executions

AI Configuration:
  GET    /ai/providers
  POST   /ai/providers
  PATCH  /ai/providers/:id
  DELETE /ai/providers/:id
  POST   /ai/test
  GET    /ai/knowledge-base
  POST   /ai/knowledge-base
  DELETE /ai/knowledge-base/:id

Broadcasts:
  GET    /broadcasts
  POST   /broadcasts
  GET    /broadcasts/:id
  PATCH  /broadcasts/:id
  POST   /broadcasts/:id/send
  DELETE /broadcasts/:id
  GET    /broadcasts/:id/stats

Segments:
  GET    /segments
  POST   /segments
  GET    /segments/:id
  PATCH  /segments/:id
  DELETE /segments/:id
  GET    /segments/:id/contacts

Webhooks:
  GET    /webhooks
  POST   /webhooks
  PATCH  /webhooks/:id
  DELETE /webhooks/:id
  GET    /webhooks/:id/deliveries

Analytics:
  GET    /analytics/overview
  GET    /analytics/messages
  GET    /analytics/response-times
  GET    /analytics/ai-performance
  GET    /analytics/team-performance
  GET    /analytics/customer-satisfaction

Integrations:
  GET    /integrations
  GET    /integrations/shopify/connect
  POST   /integrations/shopify/webhook
  // Similar for other platforms
```

### 5.2 WebSocket Events

```
Client → Server:
  - authenticate
  - join:conversation
  - leave:conversation
  - typing:start
  - typing:stop
  - message:send

Server → Client:
  - authenticated
  - message:new
  - message:ack
  - message:edited
  - message:deleted
  - conversation:updated
  - conversation:assigned
  - typing:start
  - typing:stop
  - presence:update
  - notification
```

### 5.3 Error Handling

Standard error response:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "requestId": "req_123456",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

Error codes:
- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `VALIDATION_ERROR` (400)
- `NOT_FOUND` (404)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

---

## 6. SECURITY ARCHITECTURE

### 6.1 Authentication & Authorization

- **JWT Tokens**: Short-lived access tokens (15 min) + refresh tokens (7 days)
- **Password Hashing**: bcrypt with salt rounds = 12
- **MFA**: TOTP-based (optional)
- **OAuth**: Google, Microsoft (for SSO)
- **API Keys**: For programmatic access with scoped permissions
- **Session Management**: Redis-based session store

### 6.2 Data Security

- **Encryption at Rest**:
  - Database: PostgreSQL encryption
  - Sensitive fields: AES-256-GCM (API keys, tokens)
- **Encryption in Transit**: TLS 1.3
- **PII Protection**: Hash phone numbers for analytics
- **Data Retention**: Configurable per organization
- **Backup Encryption**: GPG-encrypted backups

### 6.3 Application Security

- **Input Validation**: class-validator on all DTOs
- **SQL Injection**: Prisma ORM (parameterized queries)
- **XSS Protection**: DOMPurify on frontend
- **CSRF**: SameSite cookies + CSRF tokens
- **Rate Limiting**:
  - API: 100 req/min per user
  - WebSocket: 50 events/min
  - AI: 20 req/min per org
- **CORS**: Whitelist origins
- **Helmet**: Security headers

### 6.4 Compliance

- **GDPR**: Data export, right to deletion, consent management
- **SOC2**: Audit logs, access controls, encryption
- **HIPAA** (optional): BAA, encryption, audit trails

---

## 7. SCALABILITY STRATEGY

### 7.1 Horizontal Scaling

- **Stateless API**: Scale API servers independently
- **Load Balancing**: Round-robin with health checks
- **Session Management**: Redis cluster (not in-memory)
- **File Storage**: S3 (distributed, scalable)

### 7.2 Database Scaling

- **Read Replicas**: Analytics queries → replicas
- **Connection Pooling**: PgBouncer (max 100 connections)
- **Query Optimization**: Explain analyze, indexes
- **Caching**: Redis for hot data (contacts, settings)
- **Partitioning**: Messages table by month

### 7.3 Message Queue Scaling

- **Bull Queue**: Redis-backed, multiple workers
- **Job Types**:
  - High priority: AI responses (2 workers)
  - Medium: Webhooks (4 workers)
  - Low: Analytics (2 workers)
- **Retry Strategy**: Exponential backoff (3 attempts)

### 7.4 WhatsApp Client Scaling

- **Multi-Instance**: 1 WhatsApp session = 1 container
- **Health Monitoring**: Auto-restart on disconnect
- **Resource Limits**: 2GB RAM, 1 CPU per session
- **Clustering**: Kubernetes for orchestration (enterprise)

### 7.5 AI Scaling

- **Request Batching**: Group similar queries
- **Response Caching**: Cache common FAQs (Redis)
- **Provider Failover**: OpenAI → Anthropic → Gemini
- **Rate Limit Management**: Queue AI requests

### 7.6 Monitoring Targets

- **Target Load**: 10M messages/day
- **API Response Time**: p95 < 200ms
- **WebSocket Latency**: < 50ms
- **AI Response Time**: p95 < 5s
- **Database Query Time**: p95 < 50ms
- **Error Rate**: < 0.1%
- **Uptime**: 99.9%

---

## 8. EDGE CASES & ERROR HANDLING

### 8.1 WhatsApp-Specific

- **QR Code Timeout**: Auto-refresh every 30s
- **Session Disconnection**: Auto-reconnect with exponential backoff
- **Rate Limits**: WhatsApp limits (80 msg/s) → queue messages
- **Media Upload Failures**: Retry 3x, then notify user
- **Blocked Numbers**: Detect and mark in database
- **Message Deletion**: Sync delete events

### 8.2 AI-Specific

- **API Timeout**: Fallback to simple response
- **Token Limit Exceeded**: Truncate context intelligently
- **Provider Outage**: Failover to next provider
- **Invalid Response**: Log, notify admin, send default message
- **Cost Control**: Daily spend limit per org
- **Context Window**: Sliding window for long conversations

### 8.3 Data Integrity

- **Duplicate Messages**: Idempotency keys (whatsappMessageId)
- **Out-of-Order Messages**: Sort by timestamp
- **Missing Contact**: Auto-create from phone number
- **Orphaned Records**: Cascade deletes
- **Concurrent Updates**: Optimistic locking (Prisma)

### 8.4 System Failures

- **Database Down**: Circuit breaker, read from cache
- **Redis Down**: Degrade gracefully (no cache)
- **Queue Full**: Reject new jobs with 503
- **Disk Full**: Alert + auto-cleanup old media
- **Memory Leak**: Process restart with zero downtime

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests (70% coverage)

- **Framework**: Jest
- **Targets**: Services, utilities, helpers
- **Mocking**: Prisma, external APIs
- **Coverage**: Business logic, edge cases

### 9.2 Integration Tests (20% coverage)

- **Framework**: Jest + Supertest
- **Targets**: API endpoints, database operations
- **Test DB**: PostgreSQL (Docker)
- **Cleanup**: Transaction rollback

### 9.3 E2E Tests (10% coverage)

- **Framework**: Playwright
- **Targets**: Critical user flows
- **Scenarios**:
  - Complete onboarding
  - Send/receive message
  - Create automation
  - Send broadcast

### 9.4 Performance Tests

- **Framework**: k6, Artillery
- **Scenarios**:
  - 1000 concurrent users
  - 10K messages/min
  - 100 AI requests/min

### 9.5 Security Tests

- **Tools**: OWASP ZAP, npm audit
- **Targets**: SQL injection, XSS, CSRF
- **Frequency**: Weekly automated scan

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 Development Environment

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
  redis:
    image: redis:7
  api:
    build: ./apps/api
  web:
    build: ./apps/web
  worker:
    build: ./apps/worker
```

### 10.2 Production (Docker Swarm / Kubernetes)

```
Load Balancer (nginx)
    │
    ├─ Web (3 replicas)
    ├─ API (5 replicas)
    ├─ Worker (3 replicas)
    ├─ WhatsApp (N replicas - 1 per session)
    │
    ├─ PostgreSQL (Primary + 2 Replicas)
    ├─ Redis (Cluster - 3 nodes)
    └─ S3 / MinIO
```

### 10.3 CI/CD Pipeline

1. **Commit** → GitHub
2. **Lint & Format** → ESLint, Prettier
3. **Unit Tests** → Jest
4. **Integration Tests** → Supertest
5. **Security Scan** → npm audit, Snyk
6. **Build** → Docker images
7. **Deploy to Staging** → Auto
8. **E2E Tests** → Playwright
9. **Deploy to Production** → Manual approval
10. **Post-Deploy** → Smoke tests, monitoring

### 10.4 Zero-Downtime Deployment

- **Rolling Update**: Update 1 replica at a time
- **Health Checks**: /health endpoint
- **Graceful Shutdown**: Drain connections before shutdown
- **Database Migrations**: Backward-compatible, run before deploy

---

## 11. MONITORING & OBSERVABILITY

### 11.1 Metrics (Prometheus)

- **System**: CPU, memory, disk, network
- **Application**: Request rate, latency, errors
- **Business**: Messages sent, AI usage, active users
- **Custom**: Automation executions, broadcast success rate

### 11.2 Logging (ELK Stack)

- **Levels**: ERROR, WARN, INFO, DEBUG
- **Structured**: JSON format
- **Correlation**: Request ID across services
- **Retention**: 30 days

### 11.3 Tracing (Jaeger - optional)

- **Distributed Tracing**: Track request across services
- **Performance**: Identify slow operations

### 11.4 Alerting (PagerDuty / Slack)

- **Critical**: API down, database down (page immediately)
- **Warning**: High error rate, disk 80% full (Slack)
- **Info**: Deployment complete, backup finished (Slack)

### 11.5 Dashboards (Grafana)

1. **System Overview**: Health, uptime, resource usage
2. **API Performance**: RPS, latency, errors
3. **WhatsApp Status**: Sessions, message volume
4. **AI Analytics**: Requests, costs, latency
5. **Business Metrics**: Active users, revenue (if applicable)

---

## 12. FUTURE ENHANCEMENTS

### 12.1 Phase 3 Features

- **Voice Messages**: Transcription via Whisper API
- **Chatbot Builder**: Visual bot designer (like Dialogflow)
- **Multi-Channel**: Instagram, Facebook Messenger, Telegram
- **Advanced AI**: RAG (vector search), fine-tuned models
- **Mobile Apps**: React Native for iOS/Android
- **White-Label**: Custom branding for enterprise
- **Marketplace**: Community-built automation templates

### 12.2 Performance Optimizations

- **Edge Computing**: Deploy API at edge (Cloudflare Workers)
- **CDN**: Static assets, media files
- **GraphQL Subscriptions**: More efficient than polling
- **Database Sharding**: For 100M+ messages
- **Elasticsearch**: Advanced search capabilities

### 12.3 AI Improvements

- **Sentiment Analysis**: Detect customer mood
- **Intent Recognition**: Auto-tag conversations
- **Predictive Typing**: Suggest agent responses
- **Auto-Translation**: Multi-language support
- **Voice AI**: Phone call integration

---

## 13. COST ANALYSIS

### 13.1 Infrastructure (AWS, monthly)

- **EC2 (API + Workers)**: $200 (t3.medium × 4)
- **RDS PostgreSQL**: $150 (db.t3.medium)
- **ElastiCache Redis**: $100 (cache.t3.small)
- **S3**: $50 (10TB storage)
- **Load Balancer**: $25
- **CloudWatch**: $20
- **Total**: ~$545/month (excluding WhatsApp instances)

### 13.2 AI Costs (per 1M tokens)

- **OpenAI GPT-4**: $30 (input) + $60 (output)
- **Anthropic Claude**: $15 (input) + $75 (output)
- **Google Gemini**: $3.50 (input) + $10.50 (output)
- **Strategy**: Start with Gemini, upgrade to GPT-4 for premium

### 13.3 Break-Even Analysis

- **Free Tier**: $0 (self-hosted, community AI keys)
- **Starter ($29/mo)**: 50 users → $1,450/mo revenue → profitable at 3 customers
- **Professional ($99/mo)**: 100 users → $9,900/mo → profitable at 1 customer
- **Enterprise ($299/mo)**: Custom → negotiable

---

## 14. SUCCESS METRICS

### 14.1 Technical KPIs

- **Uptime**: 99.9%
- **API Latency**: p95 < 200ms
- **Message Delivery**: > 99.5%
- **AI Response Time**: p95 < 5s
- **Error Rate**: < 0.1%

### 14.2 Product KPIs

- **MAU**: Monthly Active Users
- **DAU/MAU Ratio**: Daily engagement
- **Messages/Day**: Platform usage
- **Automation Usage**: % of orgs using automations
- **AI Adoption**: % using AI auto-responder
- **Team Collaboration**: Avg users per org

### 14.3 Business KPIs

- **MRR**: Monthly Recurring Revenue
- **Churn Rate**: < 5%/month
- **Customer Acquisition Cost**: < $100
- **Lifetime Value**: > $1,200
- **NPS**: > 50

---

## CONCLUSION

This architecture provides:

✅ **Scalability**: 10M+ messages/day
✅ **Reliability**: 99.9% uptime with failover
✅ **Security**: Enterprise-grade encryption & compliance
✅ **Flexibility**: Modular design, easy to extend
✅ **Performance**: Sub-200ms API responses
✅ **Cost-Effective**: Optimized for self-hosted deployment
✅ **Developer-Friendly**: Clean architecture, well-documented

The system is designed to start simple (single server) and scale to enterprise (Kubernetes cluster) without major rewrites.

**Next Steps**: Begin implementation of folder structure and core modules.
