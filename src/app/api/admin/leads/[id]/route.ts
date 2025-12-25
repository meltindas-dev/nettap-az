import { NextResponse } from 'next/server';
import { LeadService, UpdateLeadStatusDTO } from '@/services';
import { logger, toErrorResponse, validateSafe, updateLeadStatusSchema, requireAdminOrISP, AuthenticatedRequest, isAdmin, checkIspOwnership } from '@/lib';

/**
 * PATCH /api/admin/leads/[id]
 * Update lead status (admin or ISP)
 */
async function updateLead(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    const body = await request.json();

    // Validate request body
    const validation = validateSafe(updateLeadStatusSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid update data',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const leadService = new LeadService();
    
    // Get the lead to check ownership
    const existingLead = await leadService.getLeadById(leadId);
    
    // ISP can only update leads assigned to them
    if (!isAdmin(request) && existingLead.assignedIspId) {
      checkIspOwnership(request, existingLead.assignedIspId);
    }

    const lead = await leadService.updateLeadStatus(leadId, validation.data as UpdateLeadStatusDTO);

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    logger.error('Failed to update lead', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}

export const PATCH = requireAdminOrISP(updateLead);
