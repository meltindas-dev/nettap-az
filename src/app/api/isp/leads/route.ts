import { NextResponse } from 'next/server';
import { LeadService } from '@/services';
import { logger, toErrorResponse, requireISP, AuthenticatedRequest, getIspIdFromRequest } from '@/lib';

/**
 * GET /api/isp/leads
 * Get leads assigned to ISP (ISP only)
 */
async function getIspLeads(request: AuthenticatedRequest) {
  try {
    const ispId = getIspIdFromRequest(request);

    const leadService = new LeadService();
    const leads = await leadService.getLeadsByIsp(ispId);

    return NextResponse.json({
      success: true,
      data: leads,
      meta: {
        total: leads.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch ISP leads', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}

export const GET = requireISP(getIspLeads);
