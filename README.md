# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

An inbound lead qualification and research agent built with [Next.js](http://nextjs.org/), [AI SDK](https://ai-sdk.dev/), [Workflow DevKit](https://useworkflow.dev/), and the [Vercel Slack Adapter](https://github.com/vercel-labs/slack-bolt). Hosted on the [Vercel AI Cloud](https://vercel.com/blog/the-ai-cloud-a-unified-platform-for-ai-workloads).

**_This is meant to serve as a reference architecture to be adapted to the needs of your specific organization._**

## Overview

**The Ultimate Lead Processing Agent** - A comprehensive AI-powered system that handles inbound lead qualification, outbound prospecting, intelligent routing, and multi-channel outreach automation.

### 🚀 Key Features

- **Enhanced Lead Categorization** - 8 sophisticated categories (HOT_LEAD, QUALIFIED, WARM_LEAD, FOLLOW_UP, etc.)
- **Advanced Lead Scoring** - 0-100 scoring with priority levels and deal value estimation
- **Intelligent Routing** - Auto-assign leads to best-fit sales reps based on expertise and workload
- **Lead Enrichment** - Automatic company data enrichment with funding, tech stack, and social profiles
- **Deep Research Agent** - 10 powerful AI tools for comprehensive prospect research
- **Personalized Outreach** - 7 email templates optimized for different lead types
- **Follow-Up Sequences** - Automated multi-touch nurture campaigns
- **Outbound Workflow** - Cold outreach with multi-channel sequences (email + LinkedIn)
- **Rich Slack Integration** - Detailed lead insights with human-in-the-loop approval

📖 **[See complete feature documentation →](./FEATURES.md)**

### Core Workflows

**Inbound Lead Processing:**
- Immediate response to form submission
- Deep research with AI agent (10 research tools)
- Lead enrichment with structured data extraction
- Advanced qualification with scoring and categorization
- Intelligent routing to appropriate sales rep
- Personalized email generation (7 template types)
- Automated follow-up sequence creation
- Slack approval with comprehensive lead analysis
- Email sending on approval

**Outbound Prospecting:**
- Prospect research and qualification
- ICP fit assessment
- Personalized cold outreach generation
- Multi-touch sequence (5-7 touchpoints over 14-21 days)
- Multi-channel (Email, LinkedIn, Phone)
- Human review before activation

## Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET,SLACK_CHANNEL_ID,EXA_API_KEY&project-name=lead-agent&repository-name=lead-agent)

## Architecture

<img width="1778" height="1958" alt="architecture" src="https://github.com/user-attachments/assets/53943961-4692-4b42-8e8d-47b03a01d233" />

```
User submits form
     ↓
start(workflow) ← (Workflow DevKit)
     ↓
Research agent ← (AI SDK Agent)
     ↓
Qualify lead ← (AI SDK generateObject)
     ↓
Generate email ← (AI SDK generateText)
     ↓
Slack approval (human-in-the-loop) ← (Slack integration)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Durable execution**: [Workflow DevKit](http://useworkflow.dev/)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Human-in-the-Loop**: [Slack Bolt + Vercel Slack Bolt adapter](https://vercel.com/templates/ai/slack-agent-template)
- **Web Search**: [Exa.ai](https://exa.ai/)

## Slack Integration

This repo uses [Slack's Bolt for JavaScript](https://docs.slack.dev/tools/bolt-js/) with the [Vercel Slack Bolt adapter](https://vercel.com/changelog/build-slack-agents-with-vercel-slack-bolt).

Slack's Bolt is the recommended way to build Slack apps with the latest platform features. While Bolt was designed for traditional long-running Node servers, Vercel's `@vercel/slack-bolt` adapter allows use of it in a serverless environment. Combining Slack's Bolt with Vercel's adapter reduces complexity and makes it easy to subscribe to Slack events and perform actions in your app.

## Using this template

This repo contains various empty functions to serve as placeholders. To fully use this template, fill out empty functions in `lib/services.ts`.

Example: Add a custom implementation of searching your own knowledge base in `queryKnowledgeBase`.

Additionally, update prompts to meet the needs of your specific business function.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Slack workspace with bot token and signing secret
  - Reference the [Vercel Slack agent template docs](https://github.com/vercel-partner-solutions/slack-agent-template) for creating a Slack app
  - You can set the permissions and configuration for your Slack app in the `manifest.json` file in the root of this repo. Paste this manifest file into the Slack dashboard when creating the app
  - **Be sure to update the request URL for interactivity and event subscriptions to be your production domain URL**
  - If Slack environment variables are not set, the app will still run with the Slack bot disabled
- [Vercel AI Gateway API Key](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys%3Futm_source%3Dai_gateway_landing_page&title=Get+an+API+Key)
- [Exa API key](https://exa.ai/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/vercel-labs/lead-agent.git
cd lead-agent
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Configure the following variables:

```bash
# Vercel AI Gateway API Key
AI_GATEWAY_API_KEY

# Slack Bot
SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET
SLACK_CHANNEL_ID

# Exa API Key
EXA_API_KEY
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application and submit a test lead.

## Project Structure

```
lead-agent/
├── app/
│   ├── api/
│   │   ├── submit/       # Form submission endpoint that kicks off workflow
│   │   └── slack/        # Slack webhook handler (receives slack events)
│   └── page.tsx          # Home page
├── lib/
│   ├── services.ts       # Core business logic (qualify, research, email)
│   ├── slack.ts          # Slack integration
│   └── types.ts          # TypeScript schemas and types
├── components/
│   ├── lead-form.tsx     # Main form component
└── workflows/
    └── inbound/          # Inbound lead workflow
        ├── index.ts      # Exported workflow function
        └── steps.ts      # Workflow steps
```

## Key Features

### Workflow durable execution with `use workflow`

This project uses [Workflow DevKit](https://useworkflow.dev) to kick off a workflow that runs the agent, qualification, and other actions.

### AI-Powered Qualification

Leads are automatically categorized (QUALIFIED, FOLLOW_UP, SUPPORT, etc.) using the latest OpenAI model via the Vercel AI SDK and `generateObject`. Reasoning is also provided for each qualification decision. Edit the qualification categories by changing the `qualificationCategorySchema` in `lib/types.ts`.

### AI SDK Agent class

Uses the [AI SDK Agent class](https://ai-sdk.dev/docs/agents/overview) to create an autonomous research agent. Create new tools for the Agent and edit prompts in `lib/services.ts`.

### Human-in-the-Loop Workflow

Generated emails are sent to Slack with approve/reject buttons, ensuring human oversight before any outbound communication.

The Slack message is defined with [Slack's Block Kit](https://docs.slack.dev/block-kit/). It can be edited in `lib/slack.ts`.

### Extensible Architecture

- Add new qualification categories in the `qualificationCategorySchema` in `types.ts`
- Adjust the prompts and configuration for all AI calls in `lib/services.ts`
- Alter the agent by tuning parameters in `lib/services.ts`
- Add new service functions if needed in `lib/services.ts`
- Follow [Vercel Workflow docs](https://useworkflow.dev) to add new steps to the workflow
- Create new workflows for other qualification flows, outbound outreach, etc.

## License

MIT
