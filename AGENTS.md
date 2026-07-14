<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions and project structure may differ from your training data.

Before modifying framework-specific code, consult the relevant documentation inside:

node_modules/next/dist/docs/

Do not assume historical Next.js behavior.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Purpose

This document defines how AI coding assistants should work on this project.

Unlike `CLAUDE.md`, which explains the architecture, this file defines development behavior and mandatory engineering rules.

Every AI agent should read both documents before making any code changes.

---

# Working Principles

Always prioritize deterministic backend logic over AI behavior.

When in doubt:

Deterministic Code > Prompt Engineering

The backend always makes the final decision.

AI should assist the backend, never replace it.

---

# Read Before Coding

Before modifying anything:

1. Read CLAUDE.md.
2. Understand the affected module.
3. Reuse existing abstractions.
4. Keep responsibilities separated.
5. Avoid unnecessary refactoring.

Never start coding before understanding the architecture.

---

# Architecture Rules

Never bypass:

- Conversation Engine
- State Machine
- Context Resolver
- Normalization Layer
- Output Validator
- Duplicate Detection
- Provider Failover

If your implementation bypasses one of these layers, stop and redesign it.

---

# AI Rules

AI is responsible only for:

- Entity extraction
- Intent detection
- Natural language generation

AI must never:

- Decide business logic
- Modify conversation state
- Write directly to the database
- Skip validation
- Skip normalization

---

# State Machine Rules

Conversation state belongs exclusively to backend code.

Never:

- Manually force state transitions.
- Change state from prompts.
- Store conversation state inside AI.

State transitions must remain deterministic.

---

# Database Rules

Never write AI output directly into the database.

Every write operation must pass through:

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

Database is always the source of truth.

---

# Coding Style

Prefer:

Small functions.

Pure functions.

Single responsibility.

Readable code.

Early returns.

Existing abstractions.

Avoid:

Large files.

Nested conditionals.

Duplicate logic.

Magic values.

Silent failures.

---

# File Organization

Before creating a new file:

Ask:

Can this be implemented inside an existing module?

Prefer extending existing modules instead of creating similar ones.

Avoid duplicate utilities.

---

# Error Handling

Never ignore errors.

Every external dependency should fail safely.

Examples:

AI Provider

Database

Webhook

WhatsApp

Supabase

Always return predictable behavior.

The application should continue operating whenever possible.

---

# AI Provider Rules

Provider failures are expected.

Never assume a provider is always available.

Always preserve:

- Health monitoring
- Cooldown
- Failover
- Retry strategy

Never hardcode provider-specific behavior inside business logic.

---

# Prompt Rules

Keep prompts simple.

Do not move backend logic into prompts.

Prompt responsibilities:

Extractor

↓

Extract

Responder

↓

Respond

Nothing more.

---

# Performance Rules

Avoid unnecessary AI calls.

Reuse existing context whenever possible.

Prefer backend computation over LLM reasoning.

Minimize token usage.

Avoid duplicate provider requests.

---

# Refactoring Rules

Do not refactor unrelated code.

Do not rename files without reason.

Do not move architecture unless requested.

Preserve backward compatibility whenever possible.

Small improvements are preferred over large rewrites.

---

# Testing Rules

Before completing any implementation:

Run:

npm run build

Verify:

- No TypeScript errors
- No build errors
- No broken imports

If conversation logic changes:

Test with realistic WhatsApp conversations.

Do not rely only on unit tests.

---

# Code Review Checklist

Before finishing, verify:

✓ Architecture preserved

✓ Validation preserved

✓ Normalization preserved

✓ State machine preserved

✓ Duplicate detection preserved

✓ Provider failover preserved

✓ No duplicated logic

✓ No unnecessary abstraction

✓ Build succeeds

✓ Existing functionality remains compatible

---

# Communication Style

When proposing changes:

Explain:

- Why the change is needed.
- Which modules are affected.
- Possible architectural impacts.

Do not make large architectural decisions without explaining the trade-offs.

If multiple approaches exist, present the alternatives and recommend the most maintainable one.

---

# Forbidden Actions

Never:

- Remove validation.
- Bypass business rules.
- Bypass normalization.
- Bypass context resolution.
- Trust AI output blindly.
- Store raw AI responses as business data.
- Introduce hidden state.
- Break deterministic behavior.
- Replace backend logic with prompt engineering.
- Add unnecessary dependencies.
- Rewrite working modules without request.

---

# Preferred Development Workflow

For every feature:

Understand

↓

Design

↓

Implement

↓

Validate

↓

Build

↓

Test

↓

Explain

Never skip validation.

Never skip build verification.

Never sacrifice deterministic architecture for convenience.

---

# Final Rule

If a requested implementation conflicts with the architectural principles described in `CLAUDE.md`, preserve the architecture first.

When necessary, explain the conflict and propose an alternative implementation instead of introducing technical debt.

# Scope Discipline

Work only on the requested task.

Do not modify unrelated modules.

Do not perform opportunistic refactoring.

Do not "clean up" code outside the requested scope.

If you discover unrelated issues, report them separately instead of fixing them automatically.