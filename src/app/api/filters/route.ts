import { NextResponse } from 'next/server';
import { FilterService } from '@/services';
import { logger, toErrorResponse } from '@/lib';

/**
 * GET /api/filters
 * Get all available filter options (cities, districts, technologies, etc.)
 */
export async function GET() {
  try {
    const filterService = new FilterService();
    const filters = await filterService.getAvailableFilters();

    return NextResponse.json({
      success: true,
      data: filters,
    });
  } catch (error) {
    logger.error('Failed to fetch filters', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
