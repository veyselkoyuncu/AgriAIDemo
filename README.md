# 🌱 AgriAI - Conversational Agricultural Activity Logging

**AgriAI** is an intelligent, WhatsApp-based conversational assistant designed to help farmers effortlessly log their daily agricultural activities using natural language.

Instead of navigating complex forms, farmers simply chat with the AI (e.g., *"Bugün bibere ilaç attım"*). The system intelligently extracts structured data (activity type, crop, product, quantity, farm location) and seamlessly manages conversational state, asking follow-up questions only for missing information.

![AgriAI Development Status](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)

> 🚀 **Note:** This project is under **active development**. We are constantly refining our NLP extraction pipelines, optimizing state management, and expanding support for complex agricultural workflows.

---

## ✨ Features

- **🗣️ Natural Language Processing:** Understands unstructured, conversational input, heavily optimized for agricultural terminology and context.
- **🧠 Smart State Management:** Node.js backend strictly owns the conversational flow, utilizing LLMs purely for translation of text to structured values.
- **🔄 Context-Aware Extraction:** Remembers the active `activity_type` and intelligently processes follow-up messages (e.g., knowing that "8 teneke" refers to the quantity of a previously mentioned pesticide).
- **🛡️ AI Provider Failover:** Built-in Smart AI Provider Health abstraction. Uses **Gemini** as the primary engine with automatic failover to **DeepSeek** in case of rate limits or timeouts.
- **📱 WhatsApp Integration:** End-to-end integration with WhatsApp webhooks for a frictionless, on-the-go user experience.
- **💾 Persistent Sessions:** Robust conversation interruption and resume capabilities backed by a secure database.

## 🏗️ Architecture

AgriAI is built on a modern, robust stack:
- **Framework:** [Next.js](https://nextjs.org/)
- **Database:** [Supabase](https://supabase.com/)
- **AI Engine:** Google Gemini & DeepSeek (via custom `FailoverAIProvider`)
- **Integration:** WhatsApp Business API

### How it works
1. **Webhook Reception:** A WhatsApp message hits our Next.js API route.
2. **State Retrieval:** The system fetches the current conversation state for the farmer.
3. **AI Extraction:** The message is passed to the active AI Provider, which returns structured JSON identifying intent and extracting entities.
4. **Deterministic Merge Logic:** Node.js merges the AI's extraction with the existing state and calculates `next_missing_field` deterministically.
5. **Response Generation:** If fields are missing, the AI generates a natural, contextual follow-up question.
6. **Persistence:** State is saved, and the message is sent back to the user via WhatsApp.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase Project
- WhatsApp Business API credentials
- Gemini API Key / DeepSeek API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/veyselkoyuncu/AgriAIDemo.git
   cd agri-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file and configure your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key
   
   # AI Provider
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_key
   DEEPSEEK_API_KEY=your_deepseek_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🛠️ Ongoing Development

We are actively iterating on the core pipeline. Current focus areas include:
- ⚡ **Performance & Observability:** Implementing end-to-end performance timing and smart provider health monitoring.
- 📦 **Payload Optimization:** Reducing token footprint by passing compact JSON state histories to the LLM.
- 🎯 **Advanced Intent Recognition:** Further reducing LLM hallucinations by tightening the extraction constraints and giving Node.js more control over the conversation boundaries.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Since the project is in active development, please open an issue first to discuss any major architectural changes.
