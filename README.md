# Logistics Platform

This repository is a Turborepo workspace for a logistics platform. It contains two Next.js frontends, shared UI/config packages, and a NestJS microservice backend foundation.

## Apps

- `apps/web`: customer/admin web app on port `3000`
- `apps/docs`: documentation app on port `3001`
- `apps/api/api-gateway`: public NestJS REST API gateway with Swagger and JWT auth on port `3002`
- `apps/api/auth-service`: Kafka-backed auth microservice with PostgreSQL and Prisma
- `apps/api/shipment-service`: Kafka-backed shipment microservice with PostgreSQL and Prisma
- `apps/api/notification-service`: Kafka event consumer with Redis-backed BullMQ jobs

## Packages

- `packages/api-types`: shared backend request, command, and event payload types
- `packages/ui`: shared React component library
- `packages/eslint-config`: shared ESLint configs
- `packages/typescript-config`: shared TypeScript configs

## Infrastructure

The local infrastructure stack is defined in `docker-compose.yml`:

- PostgreSQL on `5432`
- Kafka on `9092`
- Redis on `6379`

The PostgreSQL container initializes separate databases for `auth-service` and `shipment-service`.

## Setup

Copy `.env.example` to `.env`, then install dependencies:

```sh
npm install
```

Start the local infrastructure:

```sh
npm run dev:infra
```

Generate Prisma clients:

```sh
npm run prisma:generate
```

Run database migrations for the Prisma services:

```sh
npm run prisma:migrate
```

Start all apps and services:

```sh
npm run dev
```

Swagger is available from the API gateway at:

```txt
http://localhost:3002/api/docs
```

## Backend Flow

The first microservice slice supports auth and shipment workflows:

1. Clients call `api-gateway` over REST.
2. The gateway forwards auth and shipment commands to Kafka-backed NestJS services.
3. `auth-service` owns users and signs JWT access tokens.
4. `shipment-service` owns shipment records and timeline events.
5. `notification-service` listens for shipment events and processes notification jobs through BullMQ.

Shared backend contracts live in `packages/api-types` and are imported by the gateway and services so request and event shapes stay consistent across the monorepo.

## Useful Commands

```sh
npm run build
npm run lint
npm run check-types
npm run prisma:generate
```
