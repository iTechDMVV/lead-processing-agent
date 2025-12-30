import {
  humanFeedback,
  qualify,
  researchAgent,
  writeEmail,
  enrichLead,
  generateFollowUpSequence
} from '@/lib/services';
import {
  FormSchema,
  QualificationSchema,
  LeadEnrichmentSchema
} from '@/lib/types';

/**
 * Step 1: Research the lead using the AI research agent
 */
export const stepResearch = async (data: FormSchema) => {
  'use step';

  const { text: research } = await researchAgent.generate({
    prompt: `Conduct comprehensive research on this inbound lead:

Name: ${data.name}
Email: ${data.email}
Company: ${data.company || 'Not provided'}
Phone: ${data.phone || 'Not provided'}
Message: ${data.message}

Provide a detailed research report covering:
1. Company profile and background
2. Industry and competitive positioning
3. Funding and financial status
4. Technology stack (if applicable)
5. Recent news and developments
6. Social media presence
7. Intent analysis from their message
8. CRM history (if exists)
9. Recommended engagement approach

Focus on actionable insights that will enable personalized, high-converting outreach.`
  });

  return research;
};

/**
 * Step 2: Enrich lead data with structured company information
 */
export const stepEnrichment = async (
  data: FormSchema,
  research: string
): Promise<LeadEnrichmentSchema> => {
  'use step';

  const enrichment = await enrichLead(data, research);
  return enrichment;
};

/**
 * Step 3: Qualify and score the lead
 */
export const stepQualify = async (
  data: FormSchema,
  research: string,
  enrichment: LeadEnrichmentSchema
): Promise<QualificationSchema> => {
  'use step';

  const qualification = await qualify(data, research, enrichment);
  return qualification;
};

/**
 * Step 4: Generate personalized outreach email
 */
export const stepWriteEmail = async (
  data: FormSchema,
  research: string,
  qualification: QualificationSchema,
  enrichment: LeadEnrichmentSchema
) => {
  'use step';

  const email = await writeEmail(data, research, qualification, enrichment);
  return email;
};

/**
 * Step 5: Generate follow-up email sequence
 */
export const stepGenerateFollowUpSequence = async (
  data: FormSchema,
  qualification: QualificationSchema,
  enrichment: LeadEnrichmentSchema,
  initialEmail: string
) => {
  'use step';

  const followUpSequence = await generateFollowUpSequence(
    data,
    qualification,
    enrichment,
    [initialEmail]
  );

  return followUpSequence;
};

/**
 * Step 6: Send to Slack for human approval
 */
export const stepHumanFeedback = async (
  data: FormSchema,
  research: string,
  email: string,
  qualification: QualificationSchema,
  enrichment: LeadEnrichmentSchema
) => {
  'use step';

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step'
    );
    return;
  }

  const slackMessage = await humanFeedback(
    data,
    research,
    email,
    qualification,
    enrichment
  );
  return slackMessage;
};
