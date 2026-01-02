import { z } from 'zod';

/**
 * Lead schema
 */

export const formSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  name: z
    .string()
    .min(2, 'Name is required')
    .max(50, 'Name must be at most 50 characters.'),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number.')
    .min(10, 'Phone number must be at least 10 digits.')
    .optional()
    .or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  message: z
    .string()
    .min(10, 'Message is required')
    .max(500, 'Message must be less than 500 characters.')
});

export type FormSchema = z.infer<typeof formSchema>;

/**
 * Enhanced qualification schema with lead scoring and categorization
 */

export const qualificationCategorySchema = z.enum([
  'HOT_LEAD', // High intent, ready to buy
  'QUALIFIED', // Meets criteria, good fit
  'WARM_LEAD', // Interested but not ready
  'FOLLOW_UP', // Needs nurturing
  'COLD_LEAD', // Low priority
  'UNQUALIFIED', // Not a good fit
  'SUPPORT', // Support request, not sales
  'PARTNER' // Potential partner opportunity
]);

export const leadPrioritySchema = z.enum([
  'URGENT', // Respond immediately
  'HIGH', // Respond within 1 hour
  'MEDIUM', // Respond within 4 hours
  'LOW' // Respond within 24 hours
]);

export const industrySchema = z.enum([
  'TECHNOLOGY',
  'FINANCE',
  'HEALTHCARE',
  'RETAIL',
  'MANUFACTURING',
  'EDUCATION',
  'GOVERNMENT',
  'NONPROFIT',
  'OTHER'
]);

export const companySizeSchema = z.enum([
  'ENTERPRISE', // 1000+ employees
  'MID_MARKET', // 100-999 employees
  'SMB', // 10-99 employees
  'STARTUP', // 1-9 employees
  'UNKNOWN'
]);

export const qualificationSchema = z.object({
  category: qualificationCategorySchema,
  priority: leadPrioritySchema,
  leadScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Lead score from 0-100 based on qualification criteria'),
  reason: z.string().describe('Detailed reason for the qualification'),
  industry: industrySchema.optional(),
  companySize: companySizeSchema.optional(),
  estimatedDealValue: z
    .string()
    .optional()
    .describe('Estimated deal value (e.g. "$10K-50K", "$50K-100K", "$100K+")'),
  nextSteps: z
    .array(z.string())
    .describe('Recommended next steps for this lead'),
  assignedTo: z
    .string()
    .optional()
    .describe('Suggested sales rep or team to handle this lead')
});

export type QualificationSchema = z.infer<typeof qualificationSchema>;

/**
 * Lead enrichment schema
 */
export const leadEnrichmentSchema = z.object({
  companyName: z.string().optional(),
  companyWebsite: z.string().optional(),
  companyDescription: z.string().optional(),
  companySize: companySizeSchema.optional(),
  industry: industrySchema.optional(),
  foundedYear: z.string().optional(),
  headquarters: z.string().optional(),
  revenue: z.string().optional(),
  fundingInfo: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  socialProfiles: z
    .object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional()
    })
    .optional(),
  recentNews: z.array(z.string()).optional(),
  competitors: z.array(z.string()).optional()
});

export type LeadEnrichmentSchema = z.infer<typeof leadEnrichmentSchema>;

/**
 * Email template types
 */
export const emailTemplateTypeSchema = z.enum([
  'HOT_LEAD_RESPONSE',
  'QUALIFIED_RESPONSE',
  'FOLLOW_UP',
  'NURTURE',
  'SUPPORT_REDIRECT',
  'PARTNER_OUTREACH',
  'COLD_OUTREACH'
]);

export type EmailTemplateType = z.infer<typeof emailTemplateTypeSchema>;
