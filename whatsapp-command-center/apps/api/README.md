# WhatsApp Command Center API

Enterprise-grade REST API for WhatsApp management platform built with NestJS.

## Features

- ✅ **Authentication & Authorization** - JWT-based authentication with role-based access control
- ✅ **WhatsApp Integration** - Complete session management with whatsapp-web.js
- ✅ **AI Integration** - Support for OpenAI, Anthropic, Gemini, and Custom LLMs
- ✅ **CRM Features** - Contact management with custom fields and tags
- ✅ **Team Inbox** - Conversation management with assignments and status tracking
- ✅ **Automations** - No-code automation builder with triggers and actions
- ✅ **Broadcasts** - Campaign management with scheduling and analytics
- ✅ **Analytics** - Comprehensive analytics and reporting
- ✅ **Webhooks** - Real-time event notifications to external systems
- ✅ **WebSocket** - Real-time updates via Socket.IO

## Tech Stack

- **Framework:** NestJS 10
- **Database:** PostgreSQL 15 + Prisma ORM
- **Cache/Queue:** Redis + Bull
- **Real-time:** Socket.IO
- **Documentation:** Swagger/OpenAPI
- **Validation:** class-validator + class-transformer

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm dev
```

The API will be available at `http://localhost:3001/api/v1`

### Swagger Documentation

Once the server is running, visit: `http://localhost:3001/api/docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user and organization
- `POST /api/v1/auth/login` - Login with email and password
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/refresh` - Refresh access token

### Users & Organizations
- `GET /api/v1/users` - Get all users in organization
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `GET /api/v1/organizations/current` - Get current organization
- `PATCH /api/v1/organizations/current` - Update organization
- `GET /api/v1/organizations/stats` - Get organization statistics

### WhatsApp Sessions
- `POST /api/v1/whatsapp/sessions` - Create new WhatsApp session
- `GET /api/v1/whatsapp/sessions` - Get all sessions
- `GET /api/v1/whatsapp/sessions/:id` - Get session with QR code
- `DELETE /api/v1/whatsapp/sessions/:id` - Delete session
- `POST /api/v1/whatsapp/sessions/:id/send` - Send WhatsApp message

### Contacts
- `POST /api/v1/contacts` - Create contact
- `GET /api/v1/contacts` - Get all contacts (with search/filter)
- `GET /api/v1/contacts/:id` - Get contact details
- `PATCH /api/v1/contacts/:id` - Update contact
- `DELETE /api/v1/contacts/:id` - Delete contact
- `GET /api/v1/contacts/stats` - Get contact statistics

### Conversations
- `GET /api/v1/conversations` - Get all conversations (with filters)
- `GET /api/v1/conversations/:id` - Get conversation details
- `PATCH /api/v1/conversations/:id` - Update conversation
- `POST /api/v1/conversations/:id/mark-read` - Mark as read
- `GET /api/v1/conversations/stats` - Get conversation statistics

### Messages
- `GET /api/v1/messages/conversation/:id` - Get messages for conversation
- `GET /api/v1/messages/stats` - Get message statistics

### AI Providers
- `POST /api/v1/ai/providers` - Create AI provider configuration
- `GET /api/v1/ai/providers` - Get all AI providers
- `GET /api/v1/ai/providers/:id` - Get AI provider
- `PATCH /api/v1/ai/providers/:id` - Update AI provider
- `DELETE /api/v1/ai/providers/:id` - Delete AI provider
- `POST /api/v1/ai/providers/:id/generate` - Generate text with AI

### Automations
- `POST /api/v1/automations` - Create automation
- `GET /api/v1/automations` - Get all automations
- `GET /api/v1/automations/:id` - Get automation details
- `PATCH /api/v1/automations/:id` - Update automation
- `POST /api/v1/automations/:id/toggle` - Toggle automation on/off
- `DELETE /api/v1/automations/:id` - Delete automation
- `GET /api/v1/automations/stats` - Get automation statistics

### Broadcasts
- `POST /api/v1/broadcasts` - Create broadcast
- `GET /api/v1/broadcasts` - Get all broadcasts
- `GET /api/v1/broadcasts/:id` - Get broadcast details
- `PATCH /api/v1/broadcasts/:id` - Update broadcast
- `POST /api/v1/broadcasts/:id/send` - Send broadcast
- `DELETE /api/v1/broadcasts/:id` - Delete broadcast
- `GET /api/v1/broadcasts/stats` - Get broadcast statistics

### Analytics
- `GET /api/v1/analytics/overview` - Get analytics overview
- `GET /api/v1/analytics/message-volume` - Get message volume chart data
- `GET /api/v1/analytics/top-automations` - Get top performing automations
- `GET /api/v1/analytics/team-performance` - Get team performance metrics
- `GET /api/v1/analytics/ai-usage` - Get AI usage statistics

### Webhooks
- `POST /api/v1/webhooks` - Create webhook
- `GET /api/v1/webhooks` - Get all webhooks
- `GET /api/v1/webhooks/:id` - Get webhook
- `PATCH /api/v1/webhooks/:id` - Update webhook
- `DELETE /api/v1/webhooks/:id` - Delete webhook
- `POST /api/v1/webhooks/:id/test` - Test webhook

## WebSocket Events

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/events', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Authenticate
socket.emit('authenticate', {
  userId: 'user-id',
  organizationId: 'org-id'
});

// Join conversation
socket.emit('join-conversation', {
  conversationId: 'conversation-id'
});
```

### Events

- `new-message` - New message received
- `conversation-updated` - Conversation status changed
- `contact-updated` - Contact information updated
- `whatsapp-status-change` - WhatsApp session status changed

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/whatsapp_cc

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI Providers (Optional)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

# CORS
CORS_ORIGINS=http://localhost:3000
```

## Project Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── users/          # User management
│   │   ├── organizations/  # Organization management
│   │   ├── whatsapp/       # WhatsApp session management
│   │   ├── contacts/       # Contact/CRM management
│   │   ├── conversations/  # Conversation management
│   │   ├── messages/       # Message handling
│   │   ├── ai/             # AI provider integration
│   │   ├── automations/    # Automation engine
│   │   ├── broadcasts/     # Broadcast campaigns
│   │   ├── analytics/      # Analytics & reporting
│   │   ├── webhooks/       # Webhook management
│   │   ├── events/         # WebSocket gateway
│   │   └── database/       # Prisma service
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── nest-cli.json
└── tsconfig.json
```

## Development

```bash
# Development with hot reload
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Lint code
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start:prod
```

## Security

- All endpoints (except auth) require JWT authentication
- Passwords are hashed with bcrypt
- Rate limiting enabled (100 requests per minute)
- CORS protection
- Helmet security headers
- Input validation with class-validator
- SQL injection prevention with Prisma

## License

Proprietary - WhatsApp Command Center
