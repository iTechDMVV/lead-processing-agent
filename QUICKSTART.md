# Quick Start Guide - Ultimate Lead Processing Agent

## 🚀 Get Started in 5 Minutes

### 1. Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- API keys for:
  - Vercel AI Gateway
  - Slack (optional but recommended)
  - Exa.ai for web research

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lead-agent

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### 3. Configure Environment Variables

Edit `.env.local`:

```bash
# Required
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
EXA_API_KEY=your_exa_api_key

# Optional (for Slack integration)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your_secret
SLACK_CHANNEL_ID=C1234567890
```

### 4. Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Testing the Workflows

### Test Inbound Lead Processing

1. Navigate to `http://localhost:3000`
2. Fill out the contact form with test data:
   - Name: John Smith
   - Email: john@techstartup.com
   - Company: TechStartup Inc
   - Message: "We're looking for a solution to improve our sales process. We're a 50-person SaaS company and need to respond to leads faster."
3. Submit the form
4. Check console logs to see the workflow progress
5. If Slack is configured, check your Slack channel for the approval message

### Test Outbound Prospecting

Make a POST request to `/api/outbound`:

```bash
curl -X POST http://localhost:3000/api/outbound \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Chen",
    "email": "sarah@targetcompany.com",
    "company": "Target Company",
    "title": "VP of Sales",
    "companyWebsite": "https://targetcompany.com",
    "targetPersona": "VP Sales",
    "campaignType": "cold_outreach"
  }'
```

Or use the provided test script:

```bash
node scripts/test-outbound.js
```

## 🎯 Understanding Lead Categories

The system categorizes leads into 8 types:

### High Priority
- **HOT_LEAD** 🔥 - Immediate action, enterprise ready
- **QUALIFIED** ✅ - Good fit, clear timeline

### Medium Priority
- **WARM_LEAD** ☀️ - Interested, needs nurturing
- **FOLLOW_UP** 📧 - Potential fit, timing unclear

### Special Cases
- **PARTNER** 🤝 - Partnership opportunity
- **SUPPORT** 💬 - Redirect to support

### Low Priority
- **COLD_LEAD** ❄️ - Low intent, light touch
- **UNQUALIFIED** ❌ - Not a good fit

## 🛠️ Customization

### 1. Configure Your Sales Team

Edit `lib/lead-routing.ts`:

```typescript
export const defaultSalesTeam: SalesTeamMember[] = [
  {
    id: 'your-rep-id',
    name: 'Your Rep Name',
    email: 'rep@yourcompany.com',
    role: 'AE', // or 'ENTERPRISE_AE', 'SDR', 'TEAM_LEAD'
    industries: ['TECHNOLOGY', 'FINANCE'],
    companySizes: ['ENTERPRISE', 'MID_MARKET'],
    maxActiveLeads: 20,
    currentLeadCount: 5
  }
];
```

### 2. Customize Lead Qualification

Edit the qualification prompt in `lib/services.ts` under the `qualify()` function to match your ICP (Ideal Customer Profile).

### 3. Adjust Email Templates

Modify the email guidelines in `getEmailGuidelines()` in `lib/services.ts` to match your brand voice and value propositions.

### 4. Add Custom Research Tools

Add new tools to the research agent in `lib/services.ts`:

```typescript
const myCustomTool = tool({
  description: 'Your tool description',
  inputSchema: z.object({
    // your parameters
  }),
  execute: async ({ /* params */ }) => {
    // your implementation
  }
});

// Add to researchAgent.tools
```

## 📊 Monitoring Workflows

### View Workflow Status

Workflows run in the background using Workflow DevKit. To monitor:

1. Check console logs for step-by-step progress
2. View Slack channel for human approval steps
3. Access workflow dashboard (if deployed to Vercel)

### Console Output Example

```
🔍 Step 1: Conducting deep research on lead...
📊 Step 2: Enriching lead data...
🎯 Step 3: Qualifying and scoring lead...
✅ Lead qualified as: HOT_LEAD (Priority: URGENT, Score: 92/100)
✍️  Step 4: Generating personalized email...
📧 Step 5: Creating follow-up sequence...
📬 Generated initial email + 3 follow-ups
👤 Step 6: Sending to Slack for approval...
✅ Workflow complete - awaiting human approval
```

## 🔌 Integration Setup

### Connect Your CRM

Edit the CRM integration in `lib/services.ts`:

```typescript
export const crmSearch = tool({
  // ...
  execute: async ({ companyName, searchType = 'account' }) => {
    // Add your CRM API calls here
    // Example: Salesforce, HubSpot, Pipedrive
    const results = await yourCRM.search(companyName);
    return results;
  }
});
```

### Connect Email Provider

Edit the email sending function in `lib/services.ts`:

```typescript
export async function sendEmail(email: string) {
  // Add your email provider integration
  // Example: SendGrid, Mailgun, Resend
  await yourEmailProvider.send({
    to: email,
    // ...
  });
}
```

## 📈 Best Practices

### For Inbound Leads
1. Respond to HOT_LEADS within 1 hour
2. Review Slack approvals 2-3 times daily
3. Adjust scoring thresholds based on conversion data
4. Monitor email response rates by category

### For Outbound Campaigns
1. Research prospects thoroughly before outreach
2. Test different personalization angles
3. Space touchpoints 3-7 days apart
4. Always provide value before asking
5. Use break-up emails for closure

### General Tips
1. Keep sales team capacity updated
2. Review routing decisions weekly
3. A/B test email subject lines
4. Track lead score correlation with closed deals
5. Refine ICP criteria based on results

## 🆘 Troubleshooting

### Workflows Not Starting
- Check that environment variables are set
- Verify API keys are valid
- Check console for error messages

### Slack Integration Not Working
- Verify SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET are set
- Check that bot is invited to the channel
- Verify SLACK_CHANNEL_ID is correct

### Research Agent Failing
- Check EXA_API_KEY is valid and has credits
- Reduce agent step limit if hitting rate limits
- Check network connectivity

### Low Lead Scores
- Review and adjust qualification criteria
- Ensure research agent is gathering enough data
- Check if enrichment is working properly

## 📚 Next Steps

1. Read the [complete feature documentation](./FEATURES.md)
2. Explore the [architecture documentation](./README.md#architecture)
3. Set up your CRM integration
4. Configure your sales team
5. Deploy to Vercel
6. Set up monitoring and analytics

## 🤝 Support

For issues or questions:
1. Check the documentation
2. Review console logs
3. Test with simplified inputs
4. Verify all integrations are configured

---

Ready to process leads like a pro! 🚀
