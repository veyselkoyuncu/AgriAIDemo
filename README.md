# 🌱 AgriAI

> AI-powered conversational farm management through WhatsApp.

AgriAI is an AI-first agricultural assistant that allows farmers to record daily farming activities simply by chatting on WhatsApp.

Instead of filling forms or navigating complicated interfaces, farmers naturally describe what they did.

Example:

> "Bugün dere tarlasındaki domateslere Bravo attım."

AgriAI understands the message, extracts structured information, asks only for missing details, and stores everything in a normalized database.

The goal is simple:

**Make agricultural record keeping feel like chatting with another farmer.**

---

# Demo Conversation

Farmer

```text
Bugün domatese bravo attım.
```

Assistant

```text
Hangi tarladaki domateslere uyguladınız?
```

Farmer

```text
Dere tarlasında.
```

Assistant

```text
Kaç litre kullandınız?
```

Farmer

```text
25 litre.
```

Assistant

```text
Kaydettim.
```

No forms.

No buttons.

Just conversation.

---

# Features

## Conversational Activity Logging

Record agricultural activities using natural language.

Supported activities include:

- Irrigation
- Spraying
- Fertilization
- Harvest
- Planting
- Soil Preparation

---

## Intelligent Multi-step Conversations

The assistant automatically asks only for missing information.

Example:

User

```text
Bugün patatese sulama yaptım.
```

Assistant

```text
Hangi tarlada?
```

User

```text
Ziya Paşa.
```

Assistant

```text
Kaç saat sürdü?
```

No repeated questions.

No unnecessary confirmations.

---

## Context Awareness

The assistant remembers conversation context.

Example

```text
Bugün domatese bravo attım.

↓

Dere tarlasında.

↓

25 litre.
```

The user never repeats:

- activity
- crop
- farm
- product

unless necessary.

---

## Multiple Activities

A single message can contain multiple operations.

Example

```text
Sabah sulama yaptım sonra bravo attım.
```

Automatically becomes

Queue

```
Irrigation

↓

Spraying
```

Each activity is completed individually.

---

## Data Normalization

User input

```text
yaklaşık 2 buçuk kilo kadar
```

Stored value

```text
2.5 kg
```

Supports

- Quantity normalization
- Turkish number parsing
- Unit normalization
- Date normalization

---

## Date Understanding

Examples

```
bugün

dün

3 gün önce

geçen cuma

geçen hafta
```

Automatically converted into ISO dates.

---

## Product Dictionary

Recognizes agricultural products.

Examples

```
Bravo

Bravo 250

DAP

Üre

15-15-15

Nativo

Score
```

Mapped into canonical database values.

---

## Farm Alias Engine

Farmers rarely use official field names.

AgriAI understands aliases.

Example

```
ev önü

↓

Evin Önü
```

```
aynı tarla

↓

previous field
```

```
orada

↓

active field
```

---

## AI Validation Layer

LLMs are never trusted blindly.

Every extracted entity is validated by Node.js.

If confidence is low:

AI

↓

Validation Layer

↓

Database

↓

Conversation

The server always owns the truth.

---

## Duplicate Detection

If the same activity is submitted again within five minutes:

Instead of saving immediately:

Assistant asks

```
Bu kayıt az önce oluşturuldu.

Tekrar kaydetmek istiyor musunuz?
```

---

## Provider Failover

Automatic AI failover.

Priority

```
Gemini

↓

DeepSeek

↓

Future Providers
```

If one provider becomes unavailable:

The conversation continues automatically.

---

## Persistent Conversations

Users can stop chatting and continue later.

Conversation state survives interruptions.

---

# Architecture

```
WhatsApp

↓

Webhook

↓

Conversation Manager

↓

AI Provider

↓

Extraction

↓

Validation

↓

State Machine

↓

Supabase

↓

WhatsApp Response
```

The LLM is responsible only for understanding language.

Business logic always remains deterministic inside Node.js.

---

# Tech Stack

| Layer | Technology |
|---------|------------|
| Framework | Next.js 15 |
| Language | TypeScript |
| Database | Supabase |
| AI | Gemini + DeepSeek |
| Messaging | WhatsApp Business API |
| Runtime | Node.js |

---

# Project Structure

```
app/
components/
lib/

  ai/
  conversation/
  normalization/
  responders/
  state-machine/

supabase/

prompts/
```

---

# Current Development Status

Current progress

- ✅ Sprint 1 — Conversation Engine
- ✅ Sprint 2 — Data Quality
- 🚧 Sprint 3 — Dashboard
- ⏳ Sprint 4 — Farmer Experience
- ⏳ Sprint 5 — AI Memory
- ⏳ Sprint 6 — Operations
- ⏳ Sprint 7 — Intelligence
- ⏳ Sprint 8 — Scale

---

# Philosophy

AgriAI follows one simple rule.

> AI should understand language.

> The application should make decisions.

Large Language Models are excellent at interpreting natural language.

They should not control business rules.

All conversation flow, validation, normalization, state transitions, and persistence are deterministic.

---

# Future Roadmap

- Weather integration
- Disease prediction
- Irrigation recommendations
- Fertilizer recommendations
- Yield prediction
- Harvest forecasting
- Market prices
- Multi-farm support
- Family accounts
- Mobile PWA

---

# Installation

```bash
git clone https://github.com/veyselkoyuncu/AgriAIDemo.git

cd AgriAIDemo

npm install

npm run dev
```

Create

```
.env.local
```

Configure

```env
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

GEMINI_API_KEY=

DEEPSEEK_API_KEY=
```

---

# Contributing

Contributions are welcome.

Before implementing major architectural changes, please open an issue for discussion.

---

# License

MIT

---

Built with ❤️ to make agricultural record keeping effortless.



