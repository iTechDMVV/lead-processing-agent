import { QualificationSchema, companySizeSchema, industrySchema } from './types';
import { z } from 'zod';

/**
 * Sales team member schema
 */
export const salesTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['SDR', 'AE', 'ENTERPRISE_AE', 'TEAM_LEAD']),
  territories: z.array(z.string()).optional(),
  industries: z.array(z.infer<typeof industrySchema>).optional(),
  companySizes: z.array(z.infer<typeof companySizeSchema>).optional(),
  maxActiveLeads: z.number().optional(),
  currentLeadCount: z.number().optional()
});

export type SalesTeamMember = z.infer<typeof salesTeamMemberSchema>;

/**
 * Lead routing rules engine
 *
 * Intelligently routes leads to the most appropriate sales rep based on:
 * - Lead score and priority
 * - Company size
 * - Industry expertise
 * - Geographic territory
 * - Current workload
 * - Rep availability
 */
export class LeadRouter {
  private salesTeam: SalesTeamMember[];

  constructor(salesTeam: SalesTeamMember[] = []) {
    this.salesTeam = salesTeam;
  }

  /**
   * Route a lead to the best-fit sales rep
   */
  routeLead(qualification: QualificationSchema): SalesTeamMember | null {
    if (this.salesTeam.length === 0) {
      return null;
    }

    // Hot leads and high priority always go to enterprise AEs
    if (
      qualification.category === 'HOT_LEAD' ||
      qualification.priority === 'URGENT'
    ) {
      const enterpriseAE = this.findBestEnterpriseAE(qualification);
      if (enterpriseAE) return enterpriseAE;
    }

    // Route based on company size
    if (qualification.companySize === 'ENTERPRISE') {
      return this.findBestEnterpriseAE(qualification);
    }

    // Route based on industry expertise
    if (qualification.industry) {
      const industryExpert = this.findIndustryExpert(qualification.industry);
      if (industryExpert) return industryExpert;
    }

    // Round-robin distribution for other leads
    return this.findLeastBusyRep();
  }

  /**
   * Find best enterprise AE
   */
  private findBestEnterpriseAE(
    qualification: QualificationSchema
  ): SalesTeamMember | null {
    const enterpriseAEs = this.salesTeam.filter(
      (member) => member.role === 'ENTERPRISE_AE'
    );

    if (enterpriseAEs.length === 0) return null;

    // Find AE with matching industry and capacity
    const match = enterpriseAEs.find((ae) => {
      const hasIndustryMatch =
        qualification.industry &&
        ae.industries?.includes(qualification.industry);
      const hasCapacity =
        !ae.maxActiveLeads ||
        (ae.currentLeadCount || 0) < ae.maxActiveLeads;

      return hasIndustryMatch && hasCapacity;
    });

    if (match) return match;

    // Fallback to least busy enterprise AE
    return this.findLeastBusyRep(enterpriseAEs);
  }

  /**
   * Find rep with industry expertise
   */
  private findIndustryExpert(
    industry: z.infer<typeof industrySchema>
  ): SalesTeamMember | null {
    const experts = this.salesTeam.filter(
      (member) => member.industries?.includes(industry)
    );

    if (experts.length === 0) return null;

    return this.findLeastBusyRep(experts);
  }

  /**
   * Find least busy rep (round-robin)
   */
  private findLeastBusyRep(
    team: SalesTeamMember[] = this.salesTeam
  ): SalesTeamMember | null {
    if (team.length === 0) return null;

    return team.reduce((prev, current) => {
      const prevCount = prev.currentLeadCount || 0;
      const currentCount = current.currentLeadCount || 0;
      return prevCount < currentCount ? prev : current;
    });
  }

  /**
   * Get routing recommendation with explanation
   */
  getRoutingRecommendation(qualification: QualificationSchema): {
    assignedTo: SalesTeamMember | null;
    reason: string;
  } {
    const assignedTo = this.routeLead(qualification);

    if (!assignedTo) {
      return {
        assignedTo: null,
        reason: 'No sales team configured. Please assign manually.'
      };
    }

    let reason = `Assigned to ${assignedTo.name} (${assignedTo.role})`;

    if (qualification.category === 'HOT_LEAD') {
      reason += ' - Hot lead requires enterprise AE';
    } else if (qualification.companySize === 'ENTERPRISE') {
      reason += ' - Enterprise account';
    } else if (
      qualification.industry &&
      assignedTo.industries?.includes(qualification.industry)
    ) {
      reason += ` - Industry expertise: ${qualification.industry}`;
    } else {
      reason += ' - Best available capacity';
    }

    return { assignedTo, reason };
  }
}

/**
 * Example sales team configuration
 * This would typically come from a database or CRM
 */
export const defaultSalesTeam: SalesTeamMember[] = [
  {
    id: 'ae-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'ENTERPRISE_AE',
    industries: ['TECHNOLOGY', 'FINANCE'],
    companySizes: ['ENTERPRISE', 'MID_MARKET'],
    maxActiveLeads: 15,
    currentLeadCount: 8
  },
  {
    id: 'ae-2',
    name: 'Michael Rodriguez',
    email: 'michael.rodriguez@company.com',
    role: 'ENTERPRISE_AE',
    industries: ['HEALTHCARE', 'FINANCE'],
    companySizes: ['ENTERPRISE', 'MID_MARKET'],
    maxActiveLeads: 15,
    currentLeadCount: 12
  },
  {
    id: 'ae-3',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'AE',
    industries: ['TECHNOLOGY', 'RETAIL'],
    companySizes: ['MID_MARKET', 'SMB'],
    maxActiveLeads: 25,
    currentLeadCount: 18
  },
  {
    id: 'sdr-1',
    name: 'Emily Johnson',
    email: 'emily.johnson@company.com',
    role: 'SDR',
    industries: ['TECHNOLOGY', 'EDUCATION'],
    companySizes: ['SMB', 'STARTUP'],
    maxActiveLeads: 40,
    currentLeadCount: 25
  },
  {
    id: 'sdr-2',
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    role: 'SDR',
    industries: ['RETAIL', 'MANUFACTURING'],
    companySizes: ['SMB', 'STARTUP'],
    maxActiveLeads: 40,
    currentLeadCount: 30
  }
];

/**
 * Initialize global lead router
 */
export const leadRouter = new LeadRouter(defaultSalesTeam);
