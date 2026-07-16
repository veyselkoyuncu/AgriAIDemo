# Agri AI
> **This document is the architectural source of truth for the Agri AI project.**
>
> Every AI coding assistant (Claude, GPT, Codex, Cursor, Copilot, Antigravity, etc.) should read this file before modifying the codebase.
>
> The architecture described here takes precedence over implementation assumptions.

## Project Overview

Agri AI is an AI-powered farming assistant that enables farmers to record agricultural activities naturally through WhatsApp conversations.

Unlike traditional chatbot applications, Agri AI is built around a deterministic Conversation Engine where AI is only responsible for language understanding and natural language generation.

All business logic, conversation state, validation, normalization and persistence are controlled entirely by the backend.

The primary goal of the project is to create an assistant that feels conversational while remaining completely deterministic, reliable and production-safe.

Current supported capabilities include:

- Recording farming activities
- Multi-turn conversations
- Context inheritance
- Multi-activity extraction
- Activity queue management
- AI failover between multiple providers
- Entity normalization
- Conversation memory
- Duplicate detection
- Dashboard visualization

Future versions will include weather integrations, disease prediction, irrigation recommendations, harvest forecasting and long-term conversational memory.

# Vision

The long-term vision of Agri AI is not to build a chatbot.

The goal is to build an intelligent farming operating system.

AI should become a digital farming assistant that understands historical activities, remembers previous conversations, tracks farming operations over multiple seasons and assists farmers in making better agricultural decisions.

The assistant should eventually answer questions such as:

- What did I spray last week?
- Which fertilizer did I use last year?
- How many times did I irrigate this field?
- When should I irrigate again?
- Which field has the highest production?
- Which crops are at risk according to weather forecasts?

The architecture is intentionally designed so new intelligence modules can be added without changing the conversation engine.

# Core Philosophy

The project follows several strict architectural principles.

## AI Never Owns Business Logic

Artificial Intelligence is never responsible for business decisions.

AI may extract entities or generate responses, but it never decides how the system behaves.

## Node.js Owns The State

Conversation state always belongs to the backend.

The AI never creates, modifies or deletes conversation state.

## Database Is The Source Of Truth

Conversation context may exist temporarily in memory.

Persistent information always comes from the database.

## Never Trust AI

Every AI output must be validated before being used.

Validation includes:

- JSON schema validation
- Entity validation
- Confidence validation
- Context resolution
- Duplicate detection
- Normalization

## Deterministic > Prompt Engineering

Whenever possible, deterministic backend logic should replace prompt engineering.

The backend should always make the final decision.

## Separation of Responsibilities

Each layer has only one responsibility.

AI extracts.

Normalizer cleans.

Resolver resolves.

State Machine decides.

Database stores.

Responder communicates.

# High Level Architecture

Agri AI follows a layered architecture where every layer has a single responsibility.

```
                    WhatsApp

                        │

                        ▼

               Webhook Endpoint

                        │

                        ▼

              Conversation Engine

                        │

        ┌───────────────┼───────────────┐

        ▼                               ▼

   AI Extractor                  Context Memory

        │                               │

        ▼                               ▼

 Output Validation              Previous Activity

        │                               │

        ▼                               ▼

   Normalization  ─────────► Context Resolver

                        │

                        ▼

                 State Machine

                        │

                        ▼

              Duplicate Detection

                        │

                        ▼

                  Database Save

                        │

                        ▼

                 AI Responder

                        │

                        ▼

                 WhatsApp Reply
```

The architecture intentionally separates language understanding from business logic.

The AI is responsible only for understanding language and generating natural responses.

Every business decision is performed by deterministic backend code.

# Project Structure

```
app/
```

Contains the Next.js application.

Important folders include:

- api/webhooks/whatsapp
- dashboard
- auth

The WhatsApp webhook is the primary entry point of the system.

---

```
lib/
```

Contains the entire business logic of the application.

Business logic never belongs inside React pages or API routes.

---

```
lib/ai/
```

Responsible for AI provider abstraction.

Includes:

- Provider management
- Failover
- Health monitoring
- Payload optimization
- Output validation
- Prompt definitions

---

```
lib/conversation/
```

The heart of the application.

Responsible for:

- Conversation state
- Activity queue
- Context inheritance
- Entity resolution
- State transitions
- Activity rules

---

```
lib/normalization/
```

Responsible for converting human language into deterministic values.

Examples:

- "yaklaşık 5 kilo"

↓

"5 kg"

- "geçen cuma"

↓

"2026-07-10"

---

```
lib/gemini/
```

Contains the LLM interaction layer.

Responsibilities include:

- Entity extraction
- Response generation

Although currently named "gemini", this layer represents the generic LLM interaction layer and may later support multiple providers.

---

```
utils/
```

Shared utilities.

Examples:

- Supabase client
- Performance helpers
- WhatsApp utilities

# Conversation Lifecycle

Every incoming WhatsApp message passes through the same deterministic pipeline.

```
Incoming WhatsApp Message

        │

        ▼

Load Farmer Context

        │

        ▼

AI Entity Extraction

        │

        ▼

Output Validation

        │

        ▼

Normalization

        │

        ▼

Context Resolution

        │

        ▼

Conversation State Machine

        │

        ▼

Duplicate Detection

        │

        ▼

Database Update

        │

        ▼

Response Generation

        │

        ▼

Send WhatsApp Message
```

Every stage may reject, modify or enrich the data before passing it to the next stage.

No stage should skip another stage.

# Conversation State Machine

The conversation engine is deterministic.

Every conversation exists in exactly one state.

## ACTIVE

Waiting for a new activity.

---

## COLLECTING

The assistant is collecting missing information.

Example:

- Farm
- Crop
- Quantity
- Date

---

## WAITING_CONFIRMATION

Waiting for explicit user confirmation.

Examples:

- Duplicate detection
- Delete confirmation
- Update confirmation

---

## COMPLETED

The activity has been successfully stored.

Conversation may continue with another activity.

---

## RESET

Conversation returns to idle.

No pending activity exists.

---

## Rules

State transitions are controlled only by backend code.

AI must never decide conversation state.

Unexpected user messages should never corrupt the current state.

# Conversation Engine

The Conversation Engine coordinates the entire workflow.

Responsibilities include:

- Multi-activity queue
- Context inheritance
- Pending activity memory
- Duplicate question prevention
- Interruption handling
- Conversation recovery
- Activity completion
- State transitions

The engine always attempts to preserve as much context as possible.

For example:

User:

"I sprayed tomatoes today.
Then I irrigated potatoes yesterday."

The engine creates two separate activities and processes them sequentially.

Only one activity is active at a time.

Completed activities remain available for context inheritance.

# AI Pipeline

AI is divided into two independent responsibilities.

## Extractor

Responsible for understanding user messages.

Returns:

- Intent
- Activities
- Entities
- Confidence

Extractor never writes to the database.

---

## Responder

Responsible only for generating natural language responses.

Responder receives already validated data.

It never modifies business logic.

---

## Output Validator

Every extractor response is validated.

Checks include:

- Valid JSON
- Required fields
- Confidence ranges
- Activity schema
- Entity structure

Invalid outputs automatically fall back to safe defaults.

The application must never crash because of malformed AI responses.

# AI Provider System

The application supports multiple Large Language Model (LLM) providers.

Current architecture is provider-agnostic.

Providers may include:

- Gemini
- DeepSeek
- OpenAI
- Claude
- Future providers

---

## Provider Failover

Providers are automatically selected according to their health status.

If a provider fails:

1. Mark provider as unhealthy.
2. Start cooldown period.
3. Retry using the next healthy provider.
4. Recover automatically after cooldown.

The conversation should continue without user intervention.

---

## Provider Health

Each provider maintains its own health state.

Possible states:

- Healthy
- Cooling Down
- Unavailable

Health should never be persisted in the database.

---

## Prompt Separation

Different prompts exist for different responsibilities.

Examples:

- Entity Extraction
- Response Generation
- Future Classification
- Future Planning

Prompts should remain small and focused.

Business logic must never be implemented inside prompts.

# Normalization Layer

The normalization layer converts natural language into deterministic values before entering the business logic.

Every extracted entity should pass through normalization.

---

## Quantity Normalization

Examples:

"yaklaşık 10 kilo"

↓

10 kg

"iki buçuk litre"

↓

2.5 L

---

## Date Normalization

Examples:

bugün

↓

Current Date

geçen cuma

↓

ISO Date

3 gün önce

↓

ISO Date

Unknown expressions return null.

The assistant should ask the user again instead of guessing.

---

## Product Normalization

Examples:

Bravo

↓

Bravo 250 SC

Üre

↓

Üre Gübresi

DAP

↓

DAP

---

## Alias Resolution

Local field names should resolve to registered entities.

Examples:

ev önü

↓

Evin Önü

aynı tarla

↓

Previous Farm

orda

↓

Current Context

---

Normalization should never perform business decisions.

Its responsibility is only data cleaning.

# Database Principles

The database is the single source of truth.

Conversation memory is temporary.

Business records are permanent.

---

## Never Trust Memory

Conversation state may disappear.

Database records remain authoritative.

---

## Never Write AI Output Directly

Every AI output must pass through:

Extraction

↓

Validation

↓

Normalization

↓

Context Resolution

↓

Business Rules

↓

Database

---

## Immutable History

Activity history should never be silently modified.

Updates must be explicit.

Deletes must require confirmation.

Duplicate records should be detected before insertion.

---

## Data Quality

Stored values should always be normalized.

Avoid storing raw human language whenever possible.

Examples:

Date

Store:

2026-07-14

Not:

today

---

Quantity

Store:

15 kg

Not:

yaklaşık on beş kilo kadar

# Development Rules

Every contribution should preserve the deterministic architecture.

---

## Do Not Move Logic Into AI

If deterministic code can solve the problem,

do not solve it using prompt engineering.

---

## Validate Everything

Never trust:

- AI
- User Input
- WhatsApp Payload
- External APIs

Always validate.

---

## Single Responsibility

Each module should have one responsibility.

Avoid giant files.

Avoid mixed responsibilities.

---

## Reuse Existing Modules

Before creating new utilities,

search for existing implementations.

Avoid duplicate logic.

---

## Keep Layers Independent

Normalization should not know database details.

Conversation should not know AI implementation.

Providers should not know business logic.

---

## Small Changes

Prefer incremental improvements.

Avoid large rewrites unless requested.

---

## Always Build

Before finishing any task:

npm run build

No TypeScript errors.

No ESLint errors.

No broken imports.


# Known Challenges

Current architectural challenges include:

- Meta webhook retries
- Out-of-order AI responses
- AI provider timeouts
- Duplicate response generation
- Race conditions
- Parallel webhook execution

These problems should always be solved in deterministic backend code.

Avoid prompt-based workarounds whenever possible.

# Testing Checklist

Every completed feature should be tested using realistic WhatsApp conversations.

Minimum scenarios:

## New Activity

User creates a new activity.

Expected:

Saved successfully.

---

## Missing Information

Assistant asks only for missing fields.

---

## Context Inheritance

Second activity should inherit previous context.

---

## Multi Activity

One message containing multiple activities.

Should create queue.

---

## Duplicate Detection

Duplicate activity inside five minutes.

Should request confirmation.

---

## Relative Dates

Examples:

today

yesterday

last Friday

3 days ago

---

## Alias Resolution

Examples:

same field

there

front yard

---

## Provider Failure

Disable one provider.

Conversation should continue.

---

## Invalid AI Output

Malformed JSON.

Application must not crash.

---

## Build Verification

Run:

npm run build

Result:

No errors.

# AI Agent Instructions

Before making any code changes, understand the architecture first.

This project is not a traditional chatbot.

It is a deterministic conversation engine powered by AI.

Always preserve the following principles:

- Never bypass the Conversation Engine.
- Never bypass the State Machine.
- Never bypass the Context Resolver.
- Never bypass the Normalization Layer.
- Never write AI output directly into the database.
- Never let AI decide business logic.
- Never remove validation.
- Never remove duplicate detection.
- Never skip provider failover.
- Never replace deterministic code with prompt engineering.

When adding new features:

1. Reuse existing modules whenever possible.
2. Keep responsibilities separated.
3. Prefer backend logic over AI reasoning.
4. Keep prompts simple.
5. Validate everything.
6. Build before finishing.
7. Explain architectural impacts if core behavior changes.

If a requested change conflicts with these principles, preserve the architecture and explain the trade-offs before implementing.

# Not Yet Addressed
The following areas are intentionally undefined and will be
formalized when the relevant sprint begins:
- Multi-tenancy / data isolation model
- Permission system (family/worker roles)
- Admin/operations layer
Do not assume an implementation for these areas.
If a task touches them, stop and ask for architectural guidance
instead of inventing a model.