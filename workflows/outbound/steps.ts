import { researchAgent } from '@/lib/services';
import { generateText, generateObject } from 'ai';
import { OutboundProspect } from './index';
import { z } from 'zod';
import { sendSlackMessageWithButtons } from '@/lib/slack';

/**
 * Prospect qualification schema
 */
const prospectQualificationSchema = z.object({
  shouldReachOut: z.boolean(),
  score: z.number().min(0).max(100),
  reason: z.string(),
  icpFit: z.enum(['excellent', 'good', 'fair', 'poor']),
  estimatedDealValue: z.string().optional(),
  bestApproach: z.string(),
  personalizationAngles: z.array(z.string())
});

/**
 * Multi-touch sequence schema
 */
const multiTouchSequenceSchema = z.object({
  touchPoints: z.array(
    z.object({
      day: z.number().describe('Day in sequence'),
      channel: z.enum(['email', 'linkedin', 'phone', 'video']),
      subject: z.string().optional(),
      content: z.string(),
      objective: z.string()
    })
  ),
  totalDuration: z.number().describe('Total sequence duration in days'),
  expectedResponseRate: z.string()
});

/**
 * Step 1: Research prospect using AI agent
 */
export const stepResearchProspect = async (prospect: OutboundProspect) => {
  'use step';

  const { text: research } = await researchAgent.generate({
    prompt: `Conduct comprehensive research for OUTBOUND outreach to this prospect:

Name: ${prospect.name}
Company: ${prospect.company}
Title: ${prospect.title || 'Unknown'}
LinkedIn: ${prospect.linkedinUrl || 'Not provided'}
Company Website: ${prospect.companyWebsite || 'Not provided'}
Target Persona: ${prospect.targetPersona || 'Not specified'}
Campaign Type: ${prospect.campaignType}

Research Focus:
1. Company profile, size, industry, stage
2. Recent company news, funding, growth signals
3. Technology stack and infrastructure
4. Pain points and challenges in their role/industry
5. Competitive landscape and alternatives they might use
6. Social media presence and recent activity
7. Mutual connections or warm intro opportunities
8. Relevant case studies or success stories

Provide actionable intelligence for highly personalized cold outreach.`
  });

  return research;
};

/**
 * Step 2: Qualify prospect for outreach
 */
export const stepQualifyProspect = async (
  prospect: OutboundProspect,
  research: string
) => {
  'use step';

  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: prospectQualificationSchema,
    prompt: `Qualify this prospect for outbound outreach:

PROSPECT: ${JSON.stringify(prospect)}
RESEARCH: ${research}

Evaluate against ideal customer profile (ICP):
- Company size fit (target: 50-5000 employees)
- Industry fit (technology, finance, healthcare preferred)
- Role fit (decision maker or influencer)
- Budget indicators (funding, revenue)
- Timing signals (growth, hiring, tech stack changes)
- Competition (are they using alternatives?)

Scoring rubric:
- 80-100: Excellent fit, high priority outreach
- 60-79: Good fit, qualified for outreach
- 40-59: Fair fit, low priority
- 0-39: Poor fit, skip outreach

Provide:
- Should reach out (true/false)
- Qualification score (0-100)
- Detailed reasoning
- ICP fit assessment
- Best approach and personalization angles`
  });

  return object;
};

/**
 * Step 3: Generate personalized outbound email
 */
export const stepGenerateOutboundEmail = async (
  prospect: OutboundProspect,
  research: string,
  qualification: z.infer<typeof prospectQualificationSchema>
) => {
  'use step';

  const { text: email } = await generateText({
    model: 'openai/gpt-5',
    prompt: `Write a highly personalized cold outbound email.

PROSPECT: ${JSON.stringify(prospect)}
RESEARCH: ${research}
QUALIFICATION: ${JSON.stringify(qualification)}

Cold Email Best Practices:
1. Compelling subject line (under 50 chars, personalized)
2. Strong pattern interrupt opening
3. Demonstrate you've done research (specific, not generic)
4. One clear value proposition relevant to their role/company
5. Social proof or credibility builder
6. Clear, easy CTA (not asking for too much)
7. Keep it SHORT (under 150 words)
8. Conversational, human tone
9. Personalization angles: ${qualification.personalizationAngles.join(', ')}

Campaign Type: ${prospect.campaignType}

Do NOT:
- Use generic templates
- Talk too much about yourself/company
- Ask for 30 minute calls upfront
- Use salesy language
- Write long emails

Focus on THEM, not YOU. Lead with value.

Output format:
Subject: [subject line]

[email body]

[signature]`
  });

  return email;
};

/**
 * Step 4: Generate multi-touch sequence
 */
export const stepGenerateMultiTouchSequence = async (
  prospect: OutboundProspect,
  research: string,
  qualification: z.infer<typeof prospectQualificationSchema>,
  initialEmail: string
) => {
  'use step';

  const { object } = await generateObject({
    model: 'openai/gpt-5',
    schema: multiTouchSequenceSchema,
    prompt: `Create a strategic multi-touch outreach sequence for this prospect:

PROSPECT: ${JSON.stringify(prospect)}
RESEARCH: ${research}
QUALIFICATION: ${JSON.stringify(qualification)}
INITIAL EMAIL: ${initialEmail}

Generate a 5-7 touchpoint sequence over 14-21 days:

Touch 1 (Day 0): Initial email (already created above)
Touch 2 (Day 3): LinkedIn connection request with personalized note
Touch 3 (Day 5): Follow-up email with additional value (case study, insight)
Touch 4 (Day 7): LinkedIn message (if connected)
Touch 5 (Day 10): Value-add email (no ask, just helpful content)
Touch 6 (Day 14): Final email with soft call-to-action
Touch 7 (Optional - Day 21): Break-up email

Each touchpoint should:
- Add new value, not repeat
- Use different channels (email, linkedin)
- Build on previous touches
- Progressively soften the ask
- Maintain personalization
- Reference research and insights

Adapt timing and approach based on prospect score and campaign type.`
  });

  return object;
};

/**
 * Step 5: Send to Slack for review
 */
export const stepReviewOutbound = async (
  prospect: OutboundProspect,
  research: string,
  qualification: z.infer<typeof prospectQualificationSchema>,
  sequence: z.infer<typeof multiTouchSequenceSchema>
) => {
  'use step';

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping review step'
    );
    return;
  }

  const touchpointSummary = sequence.touchPoints
    .map(
      (tp) =>
        `• Day ${tp.day} - ${tp.channel.toUpperCase()}: ${tp.objective}`
    )
    .join('\n');

  const message = `🚀 *New Outbound Sequence: ${prospect.name}*

*🎯 PROSPECT PROFILE*
• Name: ${prospect.name}
• Title: ${prospect.title || 'Unknown'}
• Company: ${prospect.company}
• Campaign: ${prospect.campaignType}

*📊 QUALIFICATION*
• ICP Fit: *${qualification.icpFit.toUpperCase()}*
• Score: *${qualification.score}/100*
• Est. Value: ${qualification.estimatedDealValue || 'TBD'}
• Reason: ${qualification.reason.slice(0, 200)}

*🎨 PERSONALIZATION ANGLES*
${qualification.personalizationAngles.map((angle) => `• ${angle}`).join('\n')}

*📧 OUTREACH SEQUENCE (${sequence.touchPoints.length} touches over ${sequence.totalDuration} days)*
${touchpointSummary}

Expected Response Rate: ${sequence.expectedResponseRate}

*🔍 RESEARCH SUMMARY*
${research.slice(0, 400)}...

*Review the complete sequence in the thread below*

*Please approve or reject this outbound sequence*`;

  const slackChannel = process.env.SLACK_CHANNEL_ID || '';

  return await sendSlackMessageWithButtons(slackChannel, message);
};
