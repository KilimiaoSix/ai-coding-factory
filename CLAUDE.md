# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a TypeScript source snapshot of Claude Code CLI for educational and security research purposes. It is not affiliated with Anthropic and lacks internal packages (`@ant/*`, `@anthropic-ai/sandbox-runtime`).

## Build Commands

```bash
bun install          # Install dependencies (~600 packages)
bun run build        # Build CLI → dist/cli.js (~11.7 MB)
bun run dev          # Run directly from source (development)
bun run typecheck    # TypeScript type checking
bun dist/cli.js      # Run built CLI
```

Custom version: `CLAUDE_CODE_VERSION=2.0.0 bun run build`

## Architecture

**Entry point**: `src/entrypoints/cli.tsx` → dynamically imports `src/main.tsx` (Commander.js CLI)

**Core subsystems**:
- `src/tools/` — ~40 agent tool implementations (Bash, Read, Edit, Glob, Grep, Agent, WebFetch, etc.)
- `src/commands/` — ~50 slash commands (`/commit`, `/mcp`, `/doctor`, `/config`, etc.)
- `src/services/` — External integrations (API client, MCP, OAuth, LSP, analytics)
- `src/bridge/` — IDE extension communication layer (VS Code, JetBrains)
- `src/hooks/` — Permission system for tool invocation approval
- `src/components/` — Ink UI components (~140 React components for terminal UI)
- `src/ink/` — Custom Ink renderer fork (React reconciler for terminals)
- `src/coordinator/` — Multi-agent orchestration

**Key files**:
- `QueryEngine.ts` (~46K lines) — LLM API streaming, tool-call loops, retry logic
- `Tool.ts` (~29K lines) — Base tool types, input schemas, permission models
- `commands.ts` (~25K lines) — Command registry and execution

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Language | TypeScript (strict) |
| Terminal UI | React 19 + Ink (custom fork) |
| CLI Parsing | Commander.js 13 |
| Schema | Zod v3 |
| Protocols | MCP SDK, LSP |
| Telemetry | OpenTelemetry |

## Build System Notes

The build script (`scripts/build.ts`) handles:

1. **`bun:bundle` feature flags** — All flags default to `false` (PROACTIVE, KAIROS, BRIDGE_MODE, DAEMON, VOICE_MODE, AGENT_TRIGGERS, etc.). Code gated by `feature()` calls is eliminated at build time.

2. **`MACRO.*` constants** — Build-time injection (VERSION, BUILD_TIME, PACKAGE_URL, etc.)

3. **Internal package stubs** — `@ant/*` and some `@anthropic-ai/*` packages are stubbed inline with proper named exports

4. **Missing source auto-stubs** — Files not present in the snapshot are automatically stubbed at build time

## Path Aliases

TypeScript uses `src/*` → `./src/*` path mapping. Imports like `import { foo } from 'src/utils/bar'` are resolved via `tsconfig.json` paths.

## Feature Flags

All `bun:bundle` feature flags return `false` in this build. This means:
- `BRIDGE_MODE`, `DAEMON`, `VOICE_MODE`, `COORDINATOR_MODE` paths are stripped
- Chrome integration, computer-use MCP, sandbox runtime features are unavailable
- Code referencing `feature('FLAG_NAME')` evaluates to dead code and is removed

## React Notes

Uses React 19 with `useEffectEvent` hook. Requires `react-reconciler@0.33.0` (not 0.31.0) for proper `useEffectEvent` scheduler support.

## What's Missing

- Internal Anthropic packages (`@ant/claude-for-chrome-mcp`, `@ant/computer-use-*`, `@anthropic-ai/sandbox-runtime`, etc.)
- Some source files gated by feature flags or belonging to internal modules
- OAuth login requires actual Anthropic API credentials

## Repository Branches

- `main` — Claude Code Java (Spring AI rewrite)
- `claude` — This TypeScript source snapshot (current branch)
- `learn` — Educational project with 12 progressive lessons on Claude Code architecture