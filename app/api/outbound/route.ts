import { outboundProspectSchema } from '@/workflows/outbound';
import { start } from 'workflow/api';
import { workflowOutbound } from '@/workflows/outbound';

/**
 * Outbound prospecting API endpoint
 *
 * POST /api/outbound
 * Body: { name, email, company, title, linkedinUrl, companyWebsite, targetPersona, campaignType }
 *
 * This endpoint triggers the outbound workflow for proactive lead outreach
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsedBody = outboundProspectSchema.safeParse(body);
    if (!parsedBody.success) {
      return Response.json(
        { error: 'Invalid request body', details: parsedBody.error.message },
        { status: 400 }
      );
    }

    await start(workflowOutbound, [parsedBody.data]);

    return Response.json(
      {
        message: 'Outbound workflow started successfully',
        prospect: {
          name: parsedBody.data.name,
          company: parsedBody.data.company
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting outbound workflow:', error);
    return Response.json(
      { error: 'Failed to start outbound workflow' },
      { status: 500 }
    );
  }
}
