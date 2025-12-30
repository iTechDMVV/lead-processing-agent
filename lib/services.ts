import {
  Experimental_Agent as Agent,
  stepCountIs,
  tool,
  generateObject,
  generateText
} from 'ai';
import {
  FormSchema,
  QualificationSchema,
  qualificationSchema,
  leadEnrichmentSchema,
  LeadEnrichmentSchema,
  EmailTemplateType
} from '@/lib/types';
import { sendSlackMessageWithButtons } from '@/lib/slack';
import { z } from 'zod';
import { exa } from '@/lib/exa';

/**
 * ------------------------------------------------------------
 * Lead Enrichment
 * ------------------------------------------------------------
 */

/**
 * Enrich lead data with company and contact information
 */
export async function enrichLead(
  lead: FormSchema,
  research: string
): Promise<LeadEnrichmentSchema> {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: leadEnrichmentSchema,
    prompt: `Based on the following lead data and research, extract and structure company information:
    
LEAD DATA: ${JSON.stringify(lead)}
RESEARCH: ${research}

Extract all available company information including size, industry, tech stack, funding, social profiles, recent news, and competitors. If information is not available, omit those fields.`
  });

  return object;
}

/**
 * ------------------------------------------------------------
 * Lead Qualification & Scoring
 * ------------------------------------------------------------
 */

/**
 * Advanced lead qualification with scoring and categorization
 */
export async function qualify(
  lead: FormSchema,
  research: string,
  enrichment: LeadEnrichmentSchema
): Promise<QualificationSchema> {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: qualificationSchema,
    prompt: `You are an expert sales qualification analyst. Analyze this lead comprehensively and provide detailed qualification.

LEAD DATA: ${JSON.stringify(lead)}

RESEARCH: ${research}

ENRICHMENT DATA: ${JSON.stringify(enrichment)}

Qualification Guidelines:
- HOT_LEAD: High buying intent, enterprise company, clear use case, decision maker, urgent need (Score: 80-100)
- QUALIFIED: Good fit, meets ICP, has budget authority, clear timeline (Score: 60-79)
- WARM_LEAD: Interested but needs education, mid-market, exploring options (Score: 40-59)
- FOLLOW_UP: Potential fit but timing unclear, needs nurturing (Score: 30-39)
- COLD_LEAD: Low intent, small company, unclear fit (Score: 15-29)
- UNQUALIFIED: Outside ICP, no budget, wrong use case (Score: 0-14)
- SUPPORT: Technical support request, not a sales opportunity
- PARTNER: Potential partnership or integration opportunity

Priority Guidelines:
- URGENT: Hot leads, enterprise companies with immediate need
- HIGH: Qualified leads with clear timeline
- MEDIUM: Warm leads, follow-ups
- LOW: Cold leads, exploratory

Consider:
1. Company size and industry fit
2. Budget indicators from company info (funding, revenue)
3. Message urgency and clarity
4. Decision-making authority signals
5. Technical sophistication
6. Competition and market timing

Provide:
- Accurate category and priority
- Lead score (0-100)
- Detailed reasoning
- Industry and company size
- Estimated deal value
- 3-5 specific next steps
- Suggested assignment (if applicable)`
  });

  // Integrate lead routing
  try {
    const { leadRouter } = await import('./lead-routing');
    const routing = leadRouter.getRoutingRecommendation(object);

    if (routing.assignedTo) {
      object.assignedTo = `${routing.assignedTo.name} (${routing.assignedTo.email}) - ${routing.reason}`;
    }
  } catch (error) {
    console.warn('Lead routing not available:', error);
  }

  return object;
}

/**
 * ------------------------------------------------------------
 * Email Generation & Outreach
 * ------------------------------------------------------------
 */

/**
 * Get email template type based on qualification
 */
function getEmailTemplateType(
  qualification: QualificationSchema
): EmailTemplateType {
  switch (qualification.category) {
    case 'HOT_LEAD':
      return 'HOT_LEAD_RESPONSE';
    case 'QUALIFIED':
    case 'WARM_LEAD':
      return 'QUALIFIED_RESPONSE';
    case 'FOLLOW_UP':
      return 'FOLLOW_UP';
    case 'SUPPORT':
      return 'SUPPORT_REDIRECT';
    case 'PARTNER':
      return 'PARTNER_OUTREACH';
    default:
      return 'NURTURE';
  }
}

/**
 * Generate personalized outreach email with advanced templating
 */
export async function writeEmail(
  lead: FormSchema,
  research: string,
  qualification: QualificationSchema,
  enrichment: LeadEnrichmentSchema
) {
  const templateType = getEmailTemplateType(qualification);

  const { text } = await generateText({
    model: 'openai/gpt-5',
    prompt: `You are an expert sales email writer. Write a highly personalized, compelling outreach email.

LEAD INFORMATION:
${JSON.stringify(lead)}

QUALIFICATION:
- Category: ${qualification.category}
- Priority: ${qualification.priority}
- Lead Score: ${qualification.leadScore}
- Reason: ${qualification.reason}
- Next Steps: ${qualification.nextSteps.join(', ')}
- Estimated Deal Value: ${qualification.estimatedDealValue || 'Unknown'}

COMPANY ENRICHMENT:
${JSON.stringify(enrichment)}

RESEARCH INSIGHTS:
${research.slice(0, 2000)}

EMAIL TEMPLATE TYPE: ${templateType}

EMAIL GUIDELINES:

For ${templateType}:
${getEmailGuidelines(templateType)}

GENERAL REQUIREMENTS:
1. Subject line that's compelling and personalized
2. Personalize with specific company details from research
3. Reference their specific needs/pain points from their message
4. Clear value proposition relevant to their industry
5. Specific call-to-action based on lead category
6. Professional but conversational tone
7. Include relevant social proof or case studies if applicable
8. Keep it concise (150-250 words max)
9. No generic templates - every sentence should be personalized
10. Sign with appropriate urgency based on priority level

OUTPUT FORMAT:
Subject: [compelling subject line]

[Email body]

[Signature]`
  });

  return text;
}

/**
 * Get email writing guidelines based on template type
 */
function getEmailGuidelines(templateType: EmailTemplateType): string {
  const guidelines = {
    HOT_LEAD_RESPONSE: `
- Express immediate availability and priority handling
- Offer specific meeting times within next 24 hours
- Mention executive involvement if enterprise
- Highlight quick implementation path
- Create urgency while being respectful
- Direct phone number for immediate contact`,

    QUALIFIED_RESPONSE: `
- Thank them for their interest
- Demonstrate understanding of their specific needs
- Provide 2-3 relevant case studies or examples
- Suggest specific next steps (demo, call, consultation)
- Offer flexible meeting times within 48 hours
- Include relevant resources or content`,

    FOLLOW_UP: `
- Reference previous interaction or research
- Provide additional value (insight, resource, case study)
- No pressure, educational tone
- Clear but soft call-to-action
- Suggest staying in touch
- Offer specific help based on their needs`,

    NURTURE: `
- Focus on education and building relationship
- Share relevant industry insights or trends
- Provide valuable content without asking for anything
- Low-pressure, helpful tone
- Invite them to reach out when ready
- Mention you'll check back in [timeframe]`,

    SUPPORT_REDIRECT: `
- Acknowledge their request quickly
- Empathize with their issue/question
- Direct to appropriate support channel
- Provide support contact details and resources
- Offer to personally ensure they get help
- Thank them for reaching out`,

    PARTNER_OUTREACH: `
- Recognize mutual opportunity
- Highlight potential synergies
- Suggest exploratory partnership discussion
- Mention relevant integrations or collaborations
- Professional and collaborative tone
- Suggest appropriate stakeholder meeting`,

    COLD_OUTREACH: `
- Hook with relevant insight or research finding
- Demonstrate knowledge of their business
- Focus on one specific value proposition
- Clear but low-pressure CTA
- Make it easy to respond
- Offer value before asking for time`
  };

  return guidelines[templateType];
}

/**
 * Generate follow-up email sequence
 */
export async function generateFollowUpSequence(
  lead: FormSchema,
  qualification: QualificationSchema,
  enrichment: LeadEnrichmentSchema,
  previousEmails: string[]
): Promise<string[]> {
  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: z.object({
      emails: z.array(
        z.object({
          dayOffset: z.number().describe('Days after previous email'),
          subject: z.string(),
          body: z.string()
        })
      )
    }),
    prompt: `Generate a 3-email follow-up sequence for this lead:

LEAD: ${JSON.stringify(lead)}
QUALIFICATION: ${JSON.stringify(qualification)}
ENRICHMENT: ${JSON.stringify(enrichment)}
PREVIOUS EMAILS: ${previousEmails.join('\n---\n')}

Create a strategic follow-up sequence:
- Email 1: Follow-up 3 days later with additional value
- Email 2: Follow-up 7 days later with social proof or case study
- Email 3: Follow-up 14 days later with final value offer and soft close

Each email should:
- Reference but not repeat previous content
- Provide new value or insights
- Maintain consistent tone
- Have clear but progressively softer CTAs
- Be shorter than the previous email`
  });

  return object.emails.map(
    (email) => `[Day +${email.dayOffset}]
Subject: ${email.subject}

${email.body}`
  );
}

/**
 * ------------------------------------------------------------
 * Human-in-the-Loop & Slack Integration
 * ------------------------------------------------------------
 */

/**
 * Send comprehensive lead analysis to Slack for human approval
 */
export async function humanFeedback(
  lead: FormSchema,
  research: string,
  email: string,
  qualification: QualificationSchema,
  enrichment: LeadEnrichmentSchema
) {
  const priorityEmoji =
    qualification.priority === 'URGENT'
      ? '🚨'
      : qualification.priority === 'HIGH'
        ? '🔴'
        : qualification.priority === 'MEDIUM'
          ? '🟡'
          : '🟢';

  const categoryEmoji =
    qualification.category === 'HOT_LEAD'
      ? '🔥'
      : qualification.category === 'QUALIFIED'
        ? '✅'
        : qualification.category === 'WARM_LEAD'
          ? '☀️'
          : qualification.category === 'FOLLOW_UP'
            ? '📧'
            : qualification.category === 'PARTNER'
              ? '🤝'
              : qualification.category === 'SUPPORT'
                ? '💬'
                : '❄️';

  const message = `${categoryEmoji} *New Lead: ${lead.name}* ${priorityEmoji}

*📊 QUALIFICATION SUMMARY*
• Category: *${qualification.category}*
• Priority: *${qualification.priority}*
• Lead Score: *${qualification.leadScore}/100*
• Estimated Value: ${qualification.estimatedDealValue || 'TBD'}

*👤 LEAD DETAILS*
• Name: ${lead.name}
• Email: ${lead.email}
• Company: ${enrichment.companyName || lead.company || 'Unknown'}
• Phone: ${lead.phone || 'Not provided'}

*🏢 COMPANY PROFILE*
• Industry: ${qualification.industry || enrichment.industry || 'Unknown'}
• Size: ${qualification.companySize || enrichment.companySize || 'Unknown'}
• Website: ${enrichment.companyWebsite || 'N/A'}
${enrichment.revenue ? `• Revenue: ${enrichment.revenue}` : ''}
${enrichment.fundingInfo ? `• Funding: ${enrichment.fundingInfo}` : ''}

*💭 LEAD MESSAGE*
${lead.message.slice(0, 300)}${lead.message.length > 300 ? '...' : ''}

*🎯 QUALIFICATION REASON*
${qualification.reason}

*📋 NEXT STEPS*
${qualification.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${qualification.assignedTo ? `*👨‍💼 SUGGESTED ASSIGNMENT*\n${qualification.assignedTo}\n\n` : ''}*🔍 RESEARCH SUMMARY*
${research.slice(0, 400)}...

*📧 PROPOSED EMAIL*
_See email preview above this message_

*Please review and approve or reject this outreach email*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  return await sendSlackMessageWithButtons(slackChannel, message);
}

/**
 * Send an email
 */
export async function sendEmail(email: string) {
  /**
   * send email using provider like sendgrid, mailgun, resend etc.
   */
}

/**
 * ------------------------------------------------------------
 * Advanced Agent Tools
 * ------------------------------------------------------------
 */

/**
 * Web search tool with enhanced categorization
 */
const search = tool({
  description:
    'Search the web for comprehensive information about companies, people, products, or topics',
  inputSchema: z.object({
    keywords: z
      .string()
      .describe('Search query (e.g. "Apple Inc", "Y Combinator startups 2024")'),
    resultCategory: z
      .enum([
        'company',
        'research paper',
        'news',
        'pdf',
        'github',
        'tweet',
        'personal site',
        'linkedin profile',
        'financial report'
      ])
      .describe('Category of results to search for')
  }),
  execute: async ({ keywords, resultCategory }) => {
    const result = await exa.searchAndContents(keywords, {
      numResults: 3,
      type: 'keyword',
      category: resultCategory,
      summary: true
    });
    return result;
  }
});

/**
 * Fetch URL content tool
 */
export const fetchUrl = tool({
  description: 'Fetch and return text content from a specific URL as Markdown',
  inputSchema: z.object({
    url: z.string().describe('Full URL including protocol (http:// or https://)')
  }),
  execute: async ({ url }) => {
    const result = await exa.getContents(url, {
      text: true
    });
    return result;
  }
});

/**
 * Company information lookup tool
 */
export const companyLookup = tool({
  description:
    'Look up detailed company information including size, industry, funding, and recent news',
  inputSchema: z.object({
    companyName: z.string().describe('Company name or domain'),
    includeNews: z
      .boolean()
      .optional()
      .describe('Include recent news about the company')
  }),
  execute: async ({ companyName, includeNews = true }) => {
    const companyInfo = await exa.searchAndContents(
      `${companyName} company information`,
      {
        numResults: 2,
        type: 'keyword',
        category: 'company',
        summary: true
      }
    );

    let news = null;
    if (includeNews) {
      news = await exa.searchAndContents(`${companyName} news`, {
        numResults: 2,
        type: 'keyword',
        category: 'news',
        summary: true
      });
    }

    return {
      companyInfo,
      news
    };
  }
});

/**
 * Funding and financial information tool
 */
export const fundingLookup = tool({
  description:
    'Research funding rounds, investors, and financial information for a company',
  inputSchema: z.object({
    companyName: z.string().describe('Company name')
  }),
  execute: async ({ companyName }) => {
    const result = await exa.searchAndContents(
      `${companyName} funding investment venture capital`,
      {
        numResults: 2,
        type: 'keyword',
        summary: true
      }
    );
    return result;
  }
});

/**
 * CRM Search tool
 */
export const crmSearch = tool({
  description:
    'Search CRM for existing opportunities, contacts, or accounts by company name or domain',
  inputSchema: z.object({
    companyName: z.string().describe('Company name to search'),
    searchType: z
      .enum(['opportunity', 'account', 'contact'])
      .optional()
      .describe('Type of CRM record to search for')
  }),
  execute: async ({ companyName, searchType = 'account' }) => {
    /**
     * Integration point for CRM systems:
     * - Salesforce
     * - HubSpot
     * - Pipedrive
     * - Custom CRM
     *
     * Return existing opportunities, past interactions, etc.
     */
    return {
      found: false,
      records: [],
      message: `CRM integration not configured. Would search for ${searchType} records matching: ${companyName}`
    };
  }
});

/**
 * Tech stack analysis tool
 */
export const techStackAnalysis = tool({
  description:
    'Analyze the technology stack used by a company based on their domain',
  inputSchema: z.object({
    domain: z.string().describe('Company domain (e.g. "vercel.com")')
  }),
  execute: async ({ domain }) => {
    /**
     * Integration point for tech stack detection:
     * - BuiltWith
     * - Wappalyzer
     * - Custom detection
     *
     * Return technologies, frameworks, services used
     */
    return {
      detected: false,
      technologies: [],
      message: `Tech stack detection not configured. Would analyze: ${domain}`
    };
  }
});

/**
 * Competitive analysis tool
 */
export const competitiveAnalysis = tool({
  description:
    'Research competitors and competitive landscape for a company or industry',
  inputSchema: z.object({
    companyName: z.string().describe('Company or industry to analyze'),
    industry: z.string().optional().describe('Industry context')
  }),
  execute: async ({ companyName, industry }) => {
    const query = industry
      ? `${companyName} competitors in ${industry}`
      : `${companyName} competitors alternatives`;

    const result = await exa.searchAndContents(query, {
      numResults: 3,
      type: 'keyword',
      summary: true
    });
    return result;
  }
});

/**
 * Social media presence tool
 */
export const socialMediaLookup = tool({
  description: 'Find and analyze social media presence and activity',
  inputSchema: z.object({
    companyName: z.string().describe('Company or person name'),
    platform: z
      .enum(['linkedin', 'twitter', 'all'])
      .optional()
      .describe('Specific platform or all platforms')
  }),
  execute: async ({ companyName, platform = 'all' }) => {
    const searches = [];

    if (platform === 'linkedin' || platform === 'all') {
      searches.push(
        exa.searchAndContents(`${companyName} site:linkedin.com`, {
          numResults: 1,
          type: 'keyword',
          category: 'linkedin profile',
          summary: true
        })
      );
    }

    if (platform === 'twitter' || platform === 'all') {
      searches.push(
        exa.searchAndContents(`${companyName} twitter`, {
          numResults: 1,
          type: 'keyword',
          category: 'tweet',
          summary: true
        })
      );
    }

    const results = await Promise.all(searches);
    return results;
  }
});

/**
 * Query knowledge base tool
 */
const queryKnowledgeBase = tool({
  description:
    'Query internal knowledge base for product info, case studies, pricing, and documentation',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Search query for knowledge base (e.g. "pricing for enterprise", "case study fintech")'
      ),
    category: z
      .enum(['product', 'pricing', 'case-study', 'documentation', 'general'])
      .optional()
  }),
  execute: async ({ query, category }: { query: string; category?: string }) => {
    /**
     * Integration point for knowledge base:
     * - Vector database (Pinecone, Weaviate, Turbopuffer)
     * - Document store (Postgres with pgvector)
     * - Search service (Algolia, Elasticsearch)
     *
     * Return relevant internal documentation, case studies, etc.
     */
    return {
      results: [],
      message: `Knowledge base integration not configured. Would search ${category || 'all'} for: ${query}`
    };
  }
});

/**
 * Lead intent analysis tool
 */
export const analyzeIntent = tool({
  description:
    'Analyze the intent and urgency signals from lead message and context',
  inputSchema: z.object({
    message: z.string().describe('Lead message to analyze'),
    context: z.string().optional().describe('Additional context')
  }),
  execute: async ({ message, context }) => {
    const { object } = await generateObject({
      model: 'openai/gpt-5',
      schema: z.object({
        intentLevel: z
          .enum(['high', 'medium', 'low'])
          .describe('Level of buying intent'),
        urgencySignals: z
          .array(z.string())
          .describe('Specific urgency signals found'),
        painPoints: z
          .array(z.string())
          .describe('Identified pain points or needs'),
        buyingStage: z
          .enum(['awareness', 'consideration', 'decision', 'urgent'])
          .describe('Stage in buying journey'),
        keyPhrases: z.array(z.string()).describe('Important phrases indicating intent')
      }),
      prompt: `Analyze this lead message for buying intent and urgency:

MESSAGE: ${message}
${context ? `CONTEXT: ${context}` : ''}

Look for:
- Explicit requests for demos, trials, pricing
- Timeline mentions ("ASAP", "this week", "urgent")
- Problem statements indicating pain
- Decision-maker language
- Budget or procurement mentions
- Competitive pressure signals`
    });

    return object;
  }
});

/**
 * ------------------------------------------------------------
 * AI Research Agent
 * ------------------------------------------------------------
 */

/**
 * Enhanced research agent with comprehensive toolset
 *
 * This agent conducts deep research on leads including:
 * - Company information and background
 * - Industry analysis and positioning
 * - Funding and financial data
 * - Tech stack detection
 * - Competitive landscape
 * - Social media presence
 * - Recent news and developments
 * - Intent analysis
 * - CRM historical data
 */
export const researchAgent = new Agent({
  model: 'openai/gpt-5',
  system: `You are an elite B2B sales research analyst with expertise in lead qualification and company intelligence.

Your mission: Conduct comprehensive research on inbound leads to enable personalized, high-converting outreach.

RESEARCH OBJECTIVES:
1. Company Profile: Size, industry, location, funding, tech stack
2. Business Context: Recent news, growth stage, competitive position
3. Decision Maker Intel: Role, authority level, pain points
4. Intent Analysis: Urgency signals, buying stage, specific needs
5. Historical Data: Previous interactions, CRM records
6. Fit Assessment: Alignment with ideal customer profile

AVAILABLE TOOLS:
- search: Web search for company info, news, and insights
- companyLookup: Detailed company information and recent news
- fundingLookup: Funding rounds, investors, financial data
- socialMediaLookup: LinkedIn, Twitter presence and activity
- competitiveAnalysis: Competitors and market positioning
- crmSearch: Check for existing relationships or opportunities
- techStackAnalysis: Technology stack and infrastructure
- fetchUrl: Extract content from specific URLs
- queryKnowledgeBase: Internal docs, case studies, pricing info
- analyzeIntent: Deep analysis of message intent and urgency

RESEARCH STRATEGY:
1. Start with the company name/domain to get basic profile
2. Search for recent news and developments
3. Look up funding and financial information
4. Check CRM for previous interactions
5. Analyze their tech stack if relevant
6. Research competitors and market position
7. Analyze the lead's message for intent and urgency
8. Query knowledge base for relevant case studies

OUTPUT FORMAT:
Structure your findings as a comprehensive research report with:
- Executive Summary (2-3 sentences)
- Company Overview
- Key Findings & Insights
- Buying Signals & Intent Analysis
- Recommended Approach
- Relevant Case Studies or References

Be thorough but efficient. Focus on actionable intelligence that enables personalized outreach.`,
  tools: {
    search,
    companyLookup,
    fundingLookup,
    socialMediaLookup,
    competitiveAnalysis,
    crmSearch,
    techStackAnalysis,
    fetchUrl,
    queryKnowledgeBase,
    analyzeIntent
  },
  stopWhen: [stepCountIs(25)] // Allow up to 25 tool calls for comprehensive research
});
