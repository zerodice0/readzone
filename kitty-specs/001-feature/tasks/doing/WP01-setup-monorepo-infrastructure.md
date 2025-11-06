---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
  - "T007"
  - "T008"
  - "T009"
  - "T010"
  - "T011"
title: "Setup & Monorepo Infrastructure"
phase: "Phase 0 - Foundation"
lane: "doing"
assignee: "Claude Code"
agent: "claude"
shell_pid: "15576"
history:
  - timestamp: "2025-11-06T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
  - timestamp: "2025-11-06T00:01:06Z"
    lane: "doing"
    agent: "claude"
    shell_pid: "15576"
    action: "Started implementation of monorepo setup"
---

# Work Package Prompt: WP01 – Setup & Monorepo Infrastructure

## Objectives & Success Criteria

- **Primary Goal**: Establish complete monorepo skeleton with pnpm workspaces, TypeScript strict mode, and development tooling
- **Success Criteria**:
  - Project bootstraps with `pnpm install && pnpm dev`
  - Linting and formatting hooks work (Husky + lint-staged)
  - Docker Compose starts PostgreSQL 16 + Redis 7
  - All packages have TypeScript strict mode enabled (no any types)
  - Comprehensive .env.example documents all environment variables

## Context & Constraints

- **Technology Stack**: pnpm 8.x workspaces, TypeScript 5.x strict mode, Fastify (backend), React + Vite (frontend)
- **Monorepo Structure**: packages/backend, packages/frontend, packages/shared
- **Supporting Documents**:
  - kitty-specs/001-feature/plan.md - Implementation plan with tech stack
  - kitty-specs/001-feature/research.md - Technology decisions
  - kitty-specs/001-feature/spec.md - Feature requirements
- **Key Constraints**:
  - TypeScript strict mode mandatory (no any types allowed)
  - ESLint Airbnb TypeScript config for consistency
  - Docker Compose must match research.md specifications

## Subtasks & Detailed Guidance

### Subtask T001 – Create monorepo structure
- **Purpose**: Establish physical directory layout for monorepo
- **Steps**:
  1. Create root directory structure: packages/{backend,frontend,shared}
  2. Initialize each package directory
  3. Ensure proper .gitignore at root
- **Files**: /packages/backend/, /packages/frontend/, /packages/shared/, /.gitignore
- **Parallel?**: No (foundation task)

### Subtask T002 – Initialize root package.json with pnpm workspaces
- **Purpose**: Configure pnpm workspaces for monorepo management
- **Steps**:
  1. Create root package.json with workspaces configuration
  2. Add workspace glob patterns: ["packages/*"]
  3. Configure shared dev scripts (lint, format, type-check)
  4. Set "private": true to prevent accidental publishing
- **Files**: /package.json
- **Parallel?**: No (depends on T001)

### Subtask T003-T011
See tasks.md for remaining subtask details (T003-T011)

## Definition of Done Checklist

- [ ] T001-T011 completed and validated
- [ ] pnpm install succeeds on fresh clone
- [ ] pnpm dev starts all services without errors
- [ ] Docker Compose services start and pass health checks
- [ ] Pre-commit hooks work (lint + format on commit)
- [ ] TypeScript strict mode enforced
- [ ] README.md quickstart tested

## Activity Log

- 2025-11-06T00:00:00Z – system – lane=planned – Prompt created
- 2025-11-06T00:01:06Z – claude – shell_pid=15576 – lane=doing – Started implementation of monorepo setup
