import { FormSchema } from '@/lib/types';
import {
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepWriteEmail,
  stepEnrichment,
  stepGenerateFollowUpSequence
} from './steps';

/**
 * Enhanced inbound lead workflow
 *
 * This workflow orchestrates the complete lead processing pipeline:
 * 1. Deep research on the lead and company
 * 2. Data enrichment with structured company information
 * 3. Advanced qualification with scoring and categorization
 * 4. Personalized email generation based on lead category
 * 5. Follow-up sequence generation for nurturing
 * 6. Human-in-the-loop approval via Slack
 *
 * The workflow handles different lead categories with appropriate actions:
 * - HOT_LEAD: Immediate personalized outreach
 * - QUALIFIED: Tailored response with case studies
 * - WARM_LEAD: Educational content and nurture sequence
 * - FOLLOW_UP: Value-driven follow-up sequence
 * - PARTNER: Partnership exploration outreach
 * - SUPPORT: Redirect to support with empathy
 * - COLD_LEAD: Light touch nurture sequence
 * - UNQUALIFIED: Polite acknowledgment (no aggressive follow-up)
 */
export const workflowInbound = async (data: FormSchema) => {
  'use workflow';

  // Step 1: Comprehensive research
  console.log('🔍 Step 1: Conducting deep research on lead...');
  const research = await stepResearch(data);

  // Step 2: Enrich lead data
  console.log('📊 Step 2: Enriching lead data...');
  const enrichment = await stepEnrichment(data, research);

  // Step 3: Qualify and score the lead
  console.log('🎯 Step 3: Qualifying and scoring lead...');
  const qualification = await stepQualify(data, research, enrichment);

  console.log(
    `✅ Lead qualified as: ${qualification.category} (Priority: ${qualification.priority}, Score: ${qualification.leadScore}/100)`
  );

  // Step 4 & 5: Handle based on qualification category
  if (
    qualification.category === 'HOT_LEAD' ||
    qualification.category === 'QUALIFIED' ||
    qualification.category === 'WARM_LEAD' ||
    qualification.category === 'FOLLOW_UP' ||
    qualification.category === 'PARTNER'
  ) {
    // Generate personalized outreach email
    console.log('✍️  Step 4: Generating personalized email...');
    const email = await stepWriteEmail(
      data,
      research,
      qualification,
      enrichment
    );

    // Generate follow-up sequence for nurturing
    console.log('📧 Step 5: Creating follow-up sequence...');
    const followUpSequence = await stepGenerateFollowUpSequence(
      data,
      qualification,
      enrichment,
      email
    );

    console.log(
      `📬 Generated initial email + ${followUpSequence.length} follow-ups`
    );

    // Send to Slack for human approval
    console.log('👤 Step 6: Sending to Slack for approval...');
    await stepHumanFeedback(data, research, email, qualification, enrichment);

    console.log('✅ Workflow complete - awaiting human approval');
  } else if (qualification.category === 'SUPPORT') {
    // Support requests get immediate acknowledgment and redirect
    console.log('💬 Support request detected - generating redirect email...');
    const email = await stepWriteEmail(
      data,
      research,
      qualification,
      enrichment
    );

    await stepHumanFeedback(data, research, email, qualification, enrichment);

    console.log('✅ Support redirect email sent to Slack for approval');
  } else if (qualification.category === 'UNQUALIFIED') {
    // Unqualified leads get polite acknowledgment only
    console.log(
      '❌ Lead unqualified - generating polite acknowledgment email...'
    );
    const email = await stepWriteEmail(
      data,
      research,
      qualification,
      enrichment
    );

    console.log(
      '✅ Unqualified lead processed with polite acknowledgment (no follow-up sequence)'
    );
  } else if (qualification.category === 'COLD_LEAD') {
    // Cold leads get light touch nurture
    console.log('❄️  Cold lead - generating light touch nurture email...');
    const email = await stepWriteEmail(
      data,
      research,
      qualification,
      enrichment
    );

    console.log('✅ Cold lead email generated (light nurture approach)');
  }

  // Return qualification summary for tracking
  return {
    leadName: data.name,
    leadEmail: data.email,
    category: qualification.category,
    priority: qualification.priority,
    leadScore: qualification.leadScore,
    estimatedValue: qualification.estimatedDealValue,
    nextSteps: qualification.nextSteps,
    assignedTo: qualification.assignedTo
  };
};
