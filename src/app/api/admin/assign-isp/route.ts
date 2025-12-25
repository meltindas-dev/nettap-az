import { NextResponse } from 'next/server';
import { LeadService } from '@/services';
import { logger, toErrorResponse, validateSafe, assignIspSchema, requireAdmin, AuthenticatedRequest } from '@/lib';

/**
 * POST /api/admin/assign-isp
 * Assign a lead to an ISP (admin only)
 * 
 * Request body:
 * {
 *   "leadId": "uuid",
 *   "ispId": "uuid"
 * }
 */
async function assignIsp(request: AuthenticatedRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateSafe(assignIspSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid assignment data',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { leadId, ispId } = validation.data;

    const leadService = new LeadService();
    const lead = await leadService.assignLeadToIsp(leadId, ispId);

    logger.info('Lead assigned to ISP', { leadId, ispId, adminId: request.user.userId });

    return NextResponse.json({
      success: true,
      data: {
        lead,
      },
    });
  } catch (error) {
    logger.error('Failed to assign lead to ISP', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}

export const POST = requireAdmin(assignIsp);
