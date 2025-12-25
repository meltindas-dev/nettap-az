import { NextResponse } from 'next/server';
import { LeadService } from '@/services';
import { logger, toErrorResponse, parsePagination, requireAdmin, AuthenticatedRequest } from '@/lib';

/**
 * GET /api/admin/leads
 * Get all leads (admin only)
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 */
async function getLeads(request: AuthenticatedRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const { limit: validatedLimit, offset } = parsePagination({ page, limit });

    const leadService = new LeadService();
    const leads = await leadService.getAllLeads(validatedLimit, offset);

    return NextResponse.json({
      success: true,
      data: {
        leads,
      },
      meta: {
        page,
        limit: validatedLimit,
        total: leads.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch leads', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}

export const GET = requireAdmin(getLeads);
