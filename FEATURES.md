# Ultimate Lead Processing Agent - Feature Documentation

## 🚀 Overview

This is a comprehensive, AI-powered lead processing agent that handles everything from inbound lead qualification to outbound prospecting, with advanced categorization, intelligent routing, and multi-channel outreach automation.

## 🎯 Core Capabilities

### 1. **Enhanced Lead Categorization**

The system now uses 8 sophisticated lead categories instead of basic qualification:

- **HOT_LEAD** 🔥 - High buying intent, ready to buy, immediate action required
- **QUALIFIED** ✅ - Meets ICP criteria, good fit, has clear timeline
- **WARM_LEAD** ☀️ - Interested but needs nurturing and education
- **FOLLOW_UP** 📧 - Potential fit but timing unclear, requires follow-up
- **COLD_LEAD** ❄️ - Low intent or priority, light touch approach
- **UNQUALIFIED** ❌ - Outside ICP, not a good fit
- **SUPPORT** 💬 - Technical support request, redirect to support team
- **PARTNER** 🤝 - Partnership or integration opportunity

### 2. **Advanced Lead Scoring**

Every lead receives a comprehensive qualification with:

- **Lead Score**: 0-100 based on multiple factors
- **Priority Level**: URGENT, HIGH, MEDIUM, LOW
- **Industry Classification**: Technology, Finance, Healthcare, etc.
- **Company Size**: Enterprise, Mid-Market, SMB, Startup
- **Estimated Deal Value**: Dollar range estimation
- **Next Steps**: 3-5 specific recommended actions
- **Smart Assignment**: Auto-routing to appropriate sales rep

### 3. **Lead Enrichment**

Automatic data enrichment provides:

- Company profile and description
- Company size and industry
- Founded year and headquarters
- Revenue and funding information
- Technology stack analysis
- Social media profiles (LinkedIn, Twitter, Facebook)
- Recent news and developments
- Competitive landscape

### 4. **Enhanced Research Agent**

The AI research agent now has 10 powerful tools:

1. **search** - Web search with category filtering
2. **companyLookup** - Detailed company information and news
3. **fundingLookup** - Investment and financial data
4. **socialMediaLookup** - Social presence analysis
5. **competitiveAnalysis** - Market positioning research
6. **crmSearch** - Check for existing relationships
7. **techStackAnalysis** - Technology infrastructure detection
8. **fetchUrl** - Extract content from specific URLs
9. **queryKnowledgeBase** - Internal documentation search
10. **analyzeIntent** - Deep intent and urgency analysis

### 5. **Personalized Email Generation**

7 different email templates optimized for each lead type:

- **HOT_LEAD_RESPONSE** - Immediate availability, executive involvement
- **QUALIFIED_RESPONSE** - Case studies, specific next steps
- **FOLLOW_UP** - Additional value, educational tone
- **NURTURE** - Relationship building, no pressure
- **SUPPORT_REDIRECT** - Empathetic redirect to support
- **PARTNER_OUTREACH** - Collaborative, synergy-focused
- **COLD_OUTREACH** - Hook with insights, value-first

Each email includes:
- Personalized subject line
- Company-specific research references
- Pain point addressing
- Relevant social proof
- Clear, category-appropriate CTA
- Professional but conversational tone

### 6. **Automated Follow-Up Sequences**

The system generates complete follow-up sequences:

- 3-email nurture sequence
- Progressive value delivery
- Day-offset scheduling
- Decreasing pressure over time
- Context-aware content

### 7. **Intelligent Lead Routing**

Automatic assignment to the best-fit sales rep based on:

- Lead score and priority
- Company size
- Industry expertise
- Geographic territory (when configured)
- Current workload and capacity
- Rep availability

Example team structure:
- Enterprise AEs for hot leads and large accounts
- Standard AEs for mid-market
- SDRs for SMB and startups

### 8. **Enhanced Slack Integration**

Rich, detailed Slack notifications with:

- Visual priority and category indicators (emojis)
- Comprehensive lead summary
- Company profile
- Qualification reasoning
- Lead score and estimated value
- Next steps recommendations
- Assigned sales rep
- Research summary
- Email preview
- Approve/Reject buttons

### 9. **Outbound Workflow**

Complete outbound prospecting workflow (`workflows/outbound/`):

- Prospect research
- ICP fit qualification
- Personalized cold outreach email
- Multi-touch sequence generation (5-7 touchpoints)
- Multiple channels: Email, LinkedIn, Phone
- Strategic timing over 14-21 days
- Break-up email included
- Human review before sending

Campaign types supported:
- Cold outreach
- Warm introductions
- Event follow-ups
- Content engagement

## 📊 Workflow Architecture

### Inbound Lead Workflow

```
1. Lead Submission (via form)
   ↓
2. Deep Research (AI Agent with 10 tools)
   ↓
3. Data Enrichment (structured extraction)
   ↓
4. Lead Qualification & Scoring
   ↓
5. Smart Routing (assign to best rep)
   ↓
6. Personalized Email Generation
   ↓
7. Follow-Up Sequence Creation
   ↓
8. Slack Review (human-in-the-loop)
   ↓
9. Email Sending (on approval)
```

### Outbound Prospecting Workflow

```
1. Prospect Input
   ↓
2. Comprehensive Research
   ↓
3. ICP Fit Qualification
   ↓
4. Cold Email Generation
   ↓
5. Multi-Touch Sequence (5-7 touches)
   ↓
6. Slack Review
   ↓
7. Sequence Activation
```

## 🛠️ Technical Architecture

### Key Files

- **`lib/types.ts`** - Enhanced schemas with 8 categories, scoring, enrichment
- **`lib/services.ts`** - All AI services, agent tools, email generation
- **`lib/lead-routing.ts`** - Intelligent routing engine
- **`workflows/inbound/`** - Inbound lead processing workflow
- **`workflows/outbound/`** - Outbound prospecting workflow

### AI Models

All AI operations use `openai/gpt-5` via AI SDK with:
- `generateObject` for structured outputs
- `generateText` for email content
- `Agent` class for research

### Integration Points

The system has placeholders for easy integration with:

**CRM Systems:**
- Salesforce
- HubSpot
- Pipedrive
- Custom CRM

**Tech Stack Detection:**
- BuiltWith
- Wappalyzer

**Knowledge Base:**
- Pinecone
- Weaviate
- Turbopuffer
- Postgres with pgvector

**Email Sending:**
- SendGrid
- Mailgun
- Resend
- AWS SES

## 🎨 Customization Guide

### Adding New Lead Categories

Edit `lib/types.ts`:

```typescript
export const qualificationCategorySchema = z.enum([
  'YOUR_NEW_CATEGORY',
  // ... existing categories
]);
```

### Creating Custom Email Templates

Add to the `getEmailGuidelines()` function in `lib/services.ts`:

```typescript
YOUR_TEMPLATE: `
- Custom guideline 1
- Custom guideline 2
- Custom guideline 3
`
```

### Configuring Sales Team

Edit `lib/lead-routing.ts` to match your team:

```typescript
export const defaultSalesTeam: SalesTeamMember[] = [
  {
    id: 'your-rep-id',
    name: 'Rep Name',
    email: 'rep@company.com',
    role: 'AE',
    industries: ['TECHNOLOGY'],
    companySizes: ['ENTERPRISE'],
    maxActiveLeads: 20,
    currentLeadCount: 10
  }
];
```

### Adding Custom Research Tools

Add new tools in `lib/services.ts`:

```typescript
export const yourCustomTool = tool({
  description: 'What your tool does',
  inputSchema: z.object({
    param: z.string()
  }),
  execute: async ({ param }) => {
    // Your implementation
    return result;
  }
});

// Add to researchAgent tools
export const researchAgent = new Agent({
  tools: {
    yourCustomTool,
    // ... other tools
  }
});
```

## 📈 Performance Optimizations

- Research agent limited to 25 steps for efficiency
- Email summaries truncated for Slack (avoid rate limits)
- Parallel tool execution in agent
- Cached enrichment data
- Async workflow execution

## 🔐 Environment Variables

Required:
```
AI_GATEWAY_API_KEY=your_key
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your_secret
SLACK_CHANNEL_ID=C1234567890
EXA_API_KEY=your_exa_key
```

Optional (for integrations):
```
SALESFORCE_API_KEY=your_key
HUBSPOT_API_KEY=your_key
BUILTWITH_API_KEY=your_key
```

## 📝 Best Practices

### Lead Qualification
- Set clear ICP criteria in prompts
- Adjust scoring thresholds for your business
- Review and refine category assignments based on results

### Email Outreach
- Keep initial emails under 150 words
- Lead with value, not features
- Always personalize with research insights
- Test different subject lines
- Monitor response rates by category

### Follow-Up Sequences
- Provide new value in each touch
- Space touchpoints appropriately (3-7 days)
- Use break-up emails for closure
- Track engagement at each step

### Team Management
- Keep sales rep load balanced
- Update capacity numbers regularly
- Assign based on expertise, not just availability
- Review routing decisions weekly

## 🚀 Future Enhancements

Potential additions:
- A/B testing for email templates
- Predictive lead scoring with ML
- Real-time lead scoring updates
- SMS and WhatsApp channels
- Video message generation
- Calendar booking integration
- Automated meeting scheduling
- Deal forecasting
- Revenue attribution
- Performance analytics dashboard

## 📚 Additional Resources

- [AI SDK Documentation](https://ai-sdk.dev/)
- [Workflow DevKit Docs](https://useworkflow.dev/)
- [Slack Bolt SDK](https://docs.slack.dev/tools/bolt-js/)
- [Exa API Docs](https://docs.exa.ai/)

---

Built with ❤️ using Next.js, AI SDK, and Workflow DevKit
