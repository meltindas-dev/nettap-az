import { NextRequest, NextResponse } from 'next/server';
import { LeadService, CreateLeadDTO } from '@/services';
import { logger, toErrorResponse, validateSafe, createLeadSchema } from '@/lib';

/**
 * POST /api/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateSafe(createLeadSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid lead data',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const leadService = new LeadService();
    const lead = await leadService.createLead(validation.data as CreateLeadDTO);

    logger.info('Lead created via API', { leadId: lead.id });

    return NextResponse.json(
      {
        success: true,
        data: {
          lead,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create lead', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
