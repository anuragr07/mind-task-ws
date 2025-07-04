# 🗂️ Web Services Project Folder Structure (Express.js + Serverless + PostgreSQL)

This structure is optimized for:
- TypeScript-based Express.js
- Serverless deployment (e.g., Vercel, AWS Lambda)
- PostgreSQL via Prisma or pg
- Docker for local dev
- AI integration and modular code


```
web-services/
├── prisma/
│   ├── schema.prisma       # Prisma models
│   └── migrations/         # Auto-generated DB migrations

├── src/
│   ├── routes/             # Express routes (entry layer)
│   │   ├── taskRoutes.ts
│   │   └── labelRoutes.ts

│   ├── controllers/        # Handle req/res
│   │   ├── taskController.ts
│   │   └── labelController.ts

│   ├── services/           # Business logic (calls Prisma models)
│   │   ├── taskService.ts
│   │   └── labelService.ts

│   ├── models/             # Models for tables (Prisma helper wrappers)
│   │   └── prismaClient.ts

│   ├── db/
│   │   └── db.ts           # Prisma client (singleton)

│   ├── middlewares/        # Express middlewares (auth, error handling, etc.)
│   ├── types/              # TypeScript types/interfaces
│   ├── utils/              # Helpers (e.g., AI categorizer, logger)
│   ├── app.ts              # Express app (import routes, middlewares)
│   └── server.ts           # Starts server for local dev only

├── .env
├── tsconfig.json
├── package.json
├── Dockerfile
└── README.md
```

# Prisma Migrations (dev)

### Create Migrations:
```
npx prisma migrate dev

// Provide the following details in the terminal
✔ Are you sure you want to create and apply this migration? … yes
✔ Enter a name for the new migration: … Version 2.1 - Added unique constraint to the Refresh Token table
```

| Version Number      | Description |
| ------------------- | ----------- |
| Version 1.0         | Initial Migration       |
| Version 2.0         | Added Refresh Token table        |
| Version 2.1         | Added Unique constraint to token column in Refresh Token table        |
