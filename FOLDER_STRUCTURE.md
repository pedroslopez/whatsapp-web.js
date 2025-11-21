# WhatsApp Command Center - Complete Folder Structure

## Overview
This project uses a **monorepo structure** with multiple applications and shared packages.

```
whatsapp-command-center/
├── .github/                          # GitHub workflows
│   └── workflows/
│       ├── ci.yml                    # Continuous Integration
│       ├── deploy-staging.yml        # Auto-deploy to staging
│       └── deploy-production.yml     # Production deployment
│
├── apps/                             # Applications
│   ├── web/                          # Next.js Frontend Dashboard
│   │   ├── .next/                    # Build output (gitignored)
│   │   ├── public/                   # Static assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   ├── src/
│   │   │   ├── app/                  # Next.js 14 App Router
│   │   │   │   ├── (auth)/           # Auth routes group
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/      # Dashboard routes group
│   │   │   │   │   ├── inbox/
│   │   │   │   │   ├── contacts/
│   │   │   │   │   ├── automations/
│   │   │   │   │   ├── broadcasts/
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── settings/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/              # API routes (if needed)
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   └── globals.css       # Global styles
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── dropdown.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── inbox/            # Inbox-specific components
│   │   │   │   │   ├── ConversationList.tsx
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── ChatHeader.tsx
│   │   │   │   │   └── MessageInput.tsx
│   │   │   │   ├── contacts/         # CRM components
│   │   │   │   │   ├── ContactCard.tsx
│   │   │   │   │   ├── ContactForm.tsx
│   │   │   │   │   └── ContactSegments.tsx
│   │   │   │   ├── automations/      # Automation builder
│   │   │   │   │   ├── FlowCanvas.tsx
│   │   │   │   │   ├── TriggerNode.tsx
│   │   │   │   │   ├── ActionNode.tsx
│   │   │   │   │   └── ConditionNode.tsx
│   │   │   │   ├── broadcasts/       # Broadcast components
│   │   │   │   │   ├── BroadcastForm.tsx
│   │   │   │   │   └── RecipientSelector.tsx
│   │   │   │   ├── analytics/        # Analytics components
│   │   │   │   │   ├── MetricCard.tsx
│   │   │   │   │   ├── ChartContainer.tsx
│   │   │   │   │   └── DateRangePicker.tsx
│   │   │   │   ├── layout/           # Layout components
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   └── shared/           # Shared components
│   │   │   │       ├── LoadingSpinner.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── Toast.tsx
│   │   │   ├── lib/                  # Utilities
│   │   │   │   ├── api.ts            # API client
│   │   │   │   ├── socket.ts         # Socket.IO client
│   │   │   │   ├── auth.ts           # Auth helpers
│   │   │   │   ├── utils.ts          # General utilities
│   │   │   │   └── validators.ts     # Zod schemas
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useConversations.ts
│   │   │   │   ├── useContacts.ts
│   │   │   │   ├── useAutomations.ts
│   │   │   │   └── useSocket.ts
│   │   │   ├── store/                # State management (Zustand)
│   │   │   │   ├── auth.store.ts
│   │   │   │   ├── inbox.store.ts
│   │   │   │   ├── contacts.store.ts
│   │   │   │   └── ui.store.ts
│   │   │   ├── types/                # TypeScript types
│   │   │   │   ├── api.types.ts
│   │   │   │   ├── models.types.ts
│   │   │   │   └── components.types.ts
│   │   │   └── config/               # Configuration
│   │   │       ├── site.ts
│   │   │       └── constants.ts
│   │   ├── .env.example
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── api/                          # NestJS Backend API
│   │   ├── dist/                     # Build output (gitignored)
│   │   ├── src/
│   │   │   ├── main.ts               # Application entry point
│   │   │   ├── app.module.ts         # Root module
│   │   │   │
│   │   │   ├── common/               # Shared code
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── public.decorator.ts
│   │   │   │   ├── filters/
│   │   │   │   │   ├── http-exception.filter.ts
│   │   │   │   │   └── prisma-exception.filter.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   └── throttle.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── logging.interceptor.ts
│   │   │   │   │   ├── transform.interceptor.ts
│   │   │   │   │   └── timeout.interceptor.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── validation.pipe.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── logger.middleware.ts
│   │   │   │   │   └── correlation.middleware.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── pagination.dto.ts
│   │   │   │   │   └── response.dto.ts
│   │   │   │   ├── interfaces/
│   │   │   │   │   └── base.interface.ts
│   │   │   │   └── utils/
│   │   │   │       ├── helpers.ts
│   │   │   │       └── validators.ts
│   │   │   │
│   │   │   ├── config/               # Configuration module
│   │   │   │   ├── config.module.ts
│   │   │   │   ├── config.service.ts
│   │   │   │   └── configuration.ts
│   │   │   │
│   │   │   ├── database/             # Database module (Prisma)
│   │   │   │   ├── database.module.ts
│   │   │   │   ├── prisma.service.ts
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   ├── cache/                # Redis cache module
│   │   │   │   ├── cache.module.ts
│   │   │   │   └── cache.service.ts
│   │   │   │
│   │   │   ├── queue/                # Bull queue module
│   │   │   │   ├── queue.module.ts
│   │   │   │   ├── queue.service.ts
│   │   │   │   ├── processors/
│   │   │   │   │   ├── ai.processor.ts
│   │   │   │   │   ├── webhook.processor.ts
│   │   │   │   │   ├── broadcast.processor.ts
│   │   │   │   │   └── analytics.processor.ts
│   │   │   │   └── jobs/
│   │   │   │       └── job.interface.ts
│   │   │   │
│   │   │   ├── auth/                 # Authentication module
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   └── oauth.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       ├── register.dto.ts
│   │   │   │       └── refresh.dto.ts
│   │   │   │
│   │   │   ├── users/                # Users module
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.repository.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   └── update-user.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── user.entity.ts
│   │   │   │
│   │   │   ├── organizations/        # Organizations module
│   │   │   │   ├── organizations.module.ts
│   │   │   │   ├── organizations.controller.ts
│   │   │   │   ├── organizations.service.ts
│   │   │   │   ├── organizations.repository.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── whatsapp/             # WhatsApp module
│   │   │   │   ├── whatsapp.module.ts
│   │   │   │   ├── whatsapp.controller.ts
│   │   │   │   ├── whatsapp.service.ts
│   │   │   │   ├── whatsapp-client.manager.ts
│   │   │   │   ├── whatsapp-event.handler.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-session.dto.ts
│   │   │   │   │   └── send-message.dto.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── whatsapp-client.interface.ts
│   │   │   │
│   │   │   ├── contacts/             # CRM - Contacts module
│   │   │   │   ├── contacts.module.ts
│   │   │   │   ├── contacts.controller.ts
│   │   │   │   ├── contacts.service.ts
│   │   │   │   ├── contacts.repository.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-contact.dto.ts
│   │   │   │       ├── update-contact.dto.ts
│   │   │   │       └── import-contacts.dto.ts
│   │   │   │
│   │   │   ├── conversations/        # Inbox - Conversations module
│   │   │   │   ├── conversations.module.ts
│   │   │   │   ├── conversations.controller.ts
│   │   │   │   ├── conversations.service.ts
│   │   │   │   ├── conversations.repository.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── update-conversation.dto.ts
│   │   │   │   │   ├── assign-conversation.dto.ts
│   │   │   │   │   └── create-note.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── conversation.entity.ts
│   │   │   │
│   │   │   ├── messages/             # Messages module
│   │   │   │   ├── messages.module.ts
│   │   │   │   ├── messages.controller.ts
│   │   │   │   ├── messages.service.ts
│   │   │   │   ├── messages.repository.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-message.dto.ts
│   │   │   │       └── send-message.dto.ts
│   │   │   │
│   │   │   ├── tags/                 # Tags module
│   │   │   │   ├── tags.module.ts
│   │   │   │   ├── tags.controller.ts
│   │   │   │   ├── tags.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── automations/          # Automations module
│   │   │   │   ├── automations.module.ts
│   │   │   │   ├── automations.controller.ts
│   │   │   │   ├── automations.service.ts
│   │   │   │   ├── automation-engine.service.ts
│   │   │   │   ├── trigger-handler.service.ts
│   │   │   │   ├── action-executor.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-automation.dto.ts
│   │   │   │   │   └── update-automation.dto.ts
│   │   │   │   └── interfaces/
│   │   │   │       ├── trigger.interface.ts
│   │   │   │       ├── action.interface.ts
│   │   │   │       └── condition.interface.ts
│   │   │   │
│   │   │   ├── ai/                   # AI module
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   ├── ai-orchestrator.service.ts
│   │   │   │   ├── providers/
│   │   │   │   │   ├── base-ai.provider.ts
│   │   │   │   │   ├── openai.provider.ts
│   │   │   │   │   ├── anthropic.provider.ts
│   │   │   │   │   ├── gemini.provider.ts
│   │   │   │   │   └── custom.provider.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── ai-config.dto.ts
│   │   │   │   │   └── ai-request.dto.ts
│   │   │   │   └── interfaces/
│   │   │   │       ├── ai-provider.interface.ts
│   │   │   │       └── ai-response.interface.ts
│   │   │   │
│   │   │   ├── broadcasts/           # Broadcasts module
│   │   │   │   ├── broadcasts.module.ts
│   │   │   │   ├── broadcasts.controller.ts
│   │   │   │   ├── broadcasts.service.ts
│   │   │   │   ├── broadcast-executor.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-broadcast.dto.ts
│   │   │   │       └── schedule-broadcast.dto.ts
│   │   │   │
│   │   │   ├── segments/             # Segments module
│   │   │   │   ├── segments.module.ts
│   │   │   │   ├── segments.controller.ts
│   │   │   │   ├── segments.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── webhooks/             # Webhooks module
│   │   │   │   ├── webhooks.module.ts
│   │   │   │   ├── webhooks.controller.ts
│   │   │   │   ├── webhooks.service.ts
│   │   │   │   ├── webhook-executor.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── analytics/            # Analytics module
│   │   │   │   ├── analytics.module.ts
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── metrics.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── analytics-query.dto.ts
│   │   │   │
│   │   │   ├── integrations/         # Integrations module
│   │   │   │   ├── integrations.module.ts
│   │   │   │   ├── integrations.controller.ts
│   │   │   │   ├── integrations.service.ts
│   │   │   │   ├── shopify/
│   │   │   │   │   ├── shopify.service.ts
│   │   │   │   │   └── shopify.controller.ts
│   │   │   │   ├── woocommerce/
│   │   │   │   ├── google-sheets/
│   │   │   │   └── airtable/
│   │   │   │
│   │   │   ├── gateway/              # WebSocket gateway
│   │   │   │   ├── gateway.module.ts
│   │   │   │   ├── events.gateway.ts
│   │   │   │   └── gateway.adapter.ts
│   │   │   │
│   │   │   └── health/               # Health checks
│   │   │       ├── health.module.ts
│   │   │       └── health.controller.ts
│   │   │
│   │   ├── test/                     # Tests
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── .env.example
│   │   ├── .env
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── worker/                       # Background Worker
│       ├── src/
│       │   ├── index.ts
│       │   ├── processors/
│       │   │   ├── ai.processor.ts
│       │   │   ├── webhook.processor.ts
│       │   │   ├── broadcast.processor.ts
│       │   │   └── analytics.processor.ts
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                         # Shared packages
│   ├── database/                     # Prisma database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # Database migrations
│   │   │   └── seed.ts               # Database seeding
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── client.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── api.types.ts
│   │   │   ├── models.types.ts
│   │   │   ├── events.types.ts
│   │   │   └── config.types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utils/                        # Shared utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                       # Shared configuration
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   │
│   └── logger/                       # Shared logger (Winston)
│       ├── src/
│       │   ├── index.ts
│       │   └── logger.ts
│       └── package.json
│
├── docker/                           # Docker configurations
│   ├── api/
│   │   └── Dockerfile
│   ├── web/
│   │   └── Dockerfile
│   ├── worker/
│   │   └── Dockerfile
│   ├── postgres/
│   │   └── init.sql
│   └── nginx/
│       └── nginx.conf
│
├── scripts/                          # Utility scripts
│   ├── setup.sh                      # Initial setup
│   ├── migrate.sh                    # Run migrations
│   ├── seed.sh                       # Seed database
│   ├── deploy.sh                     # Deployment script
│   └── backup.sh                     # Backup script
│
├── docs/                             # Documentation
│   ├── API.md                        # API documentation
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── DEVELOPMENT.md                # Development guide
│   ├── TESTING.md                    # Testing guide
│   ├── SECURITY.md                   # Security guide
│   └── TROUBLESHOOTING.md            # Common issues
│
├── .github/                          # GitHub specific
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── .husky/                           # Git hooks
│   ├── pre-commit                    # Lint & format
│   └── pre-push                      # Tests
│
├── docker-compose.yml                # Development environment
├── docker-compose.prod.yml           # Production environment
├── .env.example                      # Example environment variables
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── package.json                      # Root package.json (monorepo)
├── pnpm-workspace.yaml               # pnpm workspace configuration
├── turbo.json                        # Turborepo configuration
├── README.md                         # Main README
├── LICENSE
└── CHANGELOG.md

```

## Key Architectural Decisions

### 1. Monorepo Structure
- **Tool**: Turborepo + pnpm workspaces
- **Why**: Share code efficiently, unified versioning, atomic commits
- **Build caching**: Faster builds with Turborepo

### 2. Frontend Architecture (apps/web)
- **Next.js 14 App Router**: Latest features, server components
- **Route Groups**: Clean organization of auth vs dashboard
- **Colocation**: Components near their routes
- **shadcn/ui**: Unstyled, accessible components
- **Zustand**: Lightweight state management
- **React Query**: Server state & caching

### 3. Backend Architecture (apps/api)
- **NestJS**: Enterprise-grade framework
- **Module-based**: Each feature is a module
- **Layered**: Controller → Service → Repository → Database
- **SOLID Principles**: Clean, maintainable code

### 4. Shared Packages
- **@repo/database**: Prisma client + schema
- **@repo/types**: Shared TypeScript types
- **@repo/utils**: Common utilities
- **@repo/logger**: Centralized logging

### 5. Testing Strategy
- **Unit**: 70% coverage (services, utilities)
- **Integration**: 20% coverage (API endpoints)
- **E2E**: 10% coverage (critical flows)

### 6. CI/CD Pipeline
- **Lint & Format**: ESLint + Prettier
- **Type Check**: TypeScript
- **Tests**: Jest + Playwright
- **Build**: Docker images
- **Deploy**: Automated to staging, manual to production

## File Naming Conventions

### Frontend (React/Next.js)
- **Components**: PascalCase (`ContactCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useContacts.ts`)
- **Utilities**: camelCase (`formatters.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)
- **Types**: PascalCase with `.types.ts` (`models.types.ts`)

### Backend (NestJS)
- **Modules**: kebab-case (`contacts.module.ts`)
- **Controllers**: kebab-case (`contacts.controller.ts`)
- **Services**: kebab-case (`contacts.service.ts`)
- **DTOs**: kebab-case (`create-contact.dto.ts`)
- **Entities**: kebab-case (`contact.entity.ts`)
- **Interfaces**: kebab-case (`ai-provider.interface.ts`)

### Database (Prisma)
- **Models**: PascalCase (`Contact`, `Conversation`)
- **Fields**: camelCase (`phoneNumber`, `createdAt`)
- **Enums**: SCREAMING_SNAKE_CASE (`OPEN`, `PENDING`)

## Import Aliases

```typescript
// TypeScript path aliases
{
  "compilerOptions": {
    "paths": {
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"],
      "@repo/database": ["../../packages/database/src"],
      "@repo/types": ["../../packages/types/src"],
      "@repo/utils": ["../../packages/utils/src"]
    }
  }
}
```

## Code Organization Principles

### 1. Feature-First Organization
- Group by feature, not by type
- Example: `/contacts` contains controller, service, repository, DTOs

### 2. Separation of Concerns
- **Presentation**: UI components, pages
- **Business Logic**: Services, use cases
- **Data Access**: Repositories, Prisma client
- **Infrastructure**: External APIs, queues, cache

### 3. Dependency Direction
- Dependencies flow inward (Clean Architecture)
- Core domain has no external dependencies
- Infrastructure depends on domain, not vice versa

### 4. Explicit is Better than Implicit
- Clear file names (`create-contact.dto.ts` not `contact.ts`)
- Explicit exports (`export { ContactService }`)
- No default exports (except React components)

### 5. DRY (Don't Repeat Yourself)
- Shared code in `/packages`
- Reusable components in `/components/ui`
- Common utilities in utils packages

## Next Steps
1. Initialize monorepo with Turborepo
2. Set up shared packages (database, types, utils)
3. Initialize Next.js frontend
4. Initialize NestJS backend
5. Configure Docker Compose for development
6. Set up CI/CD pipeline

This structure supports:
- ✅ Easy navigation
- ✅ Clear separation of concerns
- ✅ Reusable code
- ✅ Type safety across apps
- ✅ Scalability
- ✅ Team collaboration
- ✅ Testing
- ✅ Documentation
