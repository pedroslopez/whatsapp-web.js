# Quick Start Guide ⚡

Get the WhatsApp Command Center running in **5 minutes**!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Docker Desktop running

## Steps

### 1. Install Dependencies (1 min)

```bash
cd whatsapp-command-center
pnpm install
```

### 2. Start Infrastructure (30 sec)

```bash
# Start PostgreSQL, Redis, MinIO
pnpm docker:dev
```

Wait for services to be healthy (check Docker Desktop).

### 3. Setup Database (1 min)

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Optional: Seed sample data
pnpm db:seed
```

### 4. Configure Environment (30 sec)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys (optional for now)
nano .env
```

### 5. Start Development Servers (30 sec)

```bash
# Start all apps
pnpm dev
```

This starts:
- 🎨 Web UI: http://localhost:3000
- 🔧 API: http://localhost:3001
- 💾 Prisma Studio: http://localhost:5555

### 6. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Register new account |
| **API Docs** | http://localhost:3001/api | - |
| **Prisma Studio** | Run `pnpm db:studio` | - |
| **pgAdmin** | http://localhost:5050 | admin@whatsapp-cc.local / admin |
| **Redis Commander** | http://localhost:8081 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |

## Next Steps

1. **Register Account**: Create your first user
2. **Connect WhatsApp**: Add a WhatsApp session
3. **Configure AI**: Add AI provider keys in Settings
4. **Create Automation**: Build your first automation flow
5. **Send Broadcast**: Test the broadcast feature

## Troubleshooting

**Port already in use:**
```bash
# Change ports in .env
API_PORT=3002
WEB_PORT=3001
```

**Database connection failed:**
```bash
# Restart Docker services
pnpm docker:down
pnpm docker:dev
```

**Prisma errors:**
```bash
# Reset database
pnpm db:reset
```

**Clean start:**
```bash
# Nuclear option - clean everything
pnpm clean
pnpm docker:down
rm -rf node_modules
pnpm install
pnpm setup
```

## Development Workflow

```bash
# Make changes to code...

# Run tests
pnpm test

# Format code
pnpm format

# Lint
pnpm lint

# Build for production
pnpm build
```

## Need Help?

- **Documentation**: See [README.md](README.md)
- **Architecture**: See [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Issues**: Create an issue on GitHub

---

**You're all set! Happy coding! 🚀**
