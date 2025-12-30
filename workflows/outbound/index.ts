import { z } from 'zod';
import {
  stepResearchProspect,
  stepQualifyProspect,
  stepGenerateOutboundEmail,
  stepGenerateMultiTouchSequence,
  stepReviewOutbound
} from './steps';

/**
 * Outbound prospect schema
 */
export const outboundProspectSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string(),
  title: z.string().optional(),
  linkedinUrl: z.string().optional(),
  companyWebsite: z.string().optional(),
  targetPersona: z
    .string()
    .optional()
    .describe('Target persona (e.g. "VP Engineering", "CTO")'),
  campaignType: z
    .enum(['cold_outreach', 'warm_intro', 'event_follow_up', 'content_engagement'])
    .optional()
    .default('cold_outreach')
});

export type OutboundProspect = z.infer<typeof outboundProspectSchema>;

/**
 * Outbound lead generation workflow
 *
 * This workflow handles proactive outreach to prospects:
 * 1. Research prospect and company thoroughly
 * 2. Qualify prospect fit with ICP
 * 3. Generate personalized cold outreach email
 * 4. Create multi-touch sequence (email, linkedin, follow-ups)
 * 5. Send to Slack for human review before sending
 *
 * Use cases:
 * - Cold outreach to target accounts
 * - Event follow-ups
 * - Content engagement follow-ups
 * - Warm introductions
 * - Account-based marketing (ABM) campaigns
 */
export const workflowOutbound = async (prospect: OutboundProspect) => {
  'use workflow';

  console.log(`🚀 Starting outbound workflow for ${prospect.name} at ${prospect.company}`);

  // Step 1: Deep research on prospect and company
  console.log('🔍 Step 1: Researching prospect and company...');
  const research = await stepResearchProspect(prospect);

  // Step 2: Qualify if this prospect is worth outreach
  console.log('🎯 Step 2: Qualifying prospect fit...');
  const qualification = await stepQualifyProspect(prospect, research);

  // Only proceed if prospect is qualified for outreach
  if (qualification.shouldReachOut) {
    console.log(
      `✅ Prospect qualified for outreach (Score: ${qualification.score}/100)`
    );

    // Step 3: Generate personalized outbound email
    console.log('✍️  Step 3: Generating personalized outbound email...');
    const initialEmail = await stepGenerateOutboundEmail(
      prospect,
      research,
      qualification
    );

    // Step 4: Generate multi-touch sequence
    console.log('📧 Step 4: Creating multi-touch outreach sequence...');
    const sequence = await stepGenerateMultiTouchSequence(
      prospect,
      research,
      qualification,
      initialEmail
    );

    console.log(
      `📬 Generated complete outreach sequence: ${sequence.touchPoints.length} touchpoints`
    );

    // Step 5: Send to Slack for review
    console.log('👤 Step 5: Sending to Slack for approval...');
    await stepReviewOutbound(prospect, research, qualification, sequence);

    console.log('✅ Outbound workflow complete - awaiting human approval');

    return {
      prospectName: prospect.name,
      company: prospect.company,
      qualified: true,
      score: qualification.score,
      sequenceLength: sequence.touchPoints.length,
      estimatedValue: qualification.estimatedDealValue
    };
  } else {
    console.log(`❌ Prospect not qualified for outreach: ${qualification.reason}`);

    return {
      prospectName: prospect.name,
      company: prospect.company,
      qualified: false,
      reason: qualification.reason
    };
  }
};
