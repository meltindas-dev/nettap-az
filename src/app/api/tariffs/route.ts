import { NextRequest, NextResponse } from 'next/server';
import { TariffService } from '@/services';
import { logger, toErrorResponse, validateSafe, tariffFilterSchema } from '@/lib';
import { TariffFilterCriteria, TariffSortOptions } from '@/domain';

/**
 * GET /api/tariffs
 * Get tariffs based on filter criteria
 * 
 * Query parameters:
 * - cityId: string (UUID)
 * - districtIds: string[] (comma-separated UUIDs)
 * - technologies: string[] (comma-separated)
 * - minSpeedMbps: number
 * - maxSpeedMbps: number
 * - minPriceMonthly: number
 * - maxPriceMonthly: number
 * - maxContractLength: number
 * - freeModem: boolean
 * - freeInstallation: boolean
 * - sortBy: 'price' | 'speed' | 'speed_price_ratio' | 'priority'
 * - sortOrder: 'asc' | 'desc'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter criteria from query parameters
    const criteria: TariffFilterCriteria = {
      cityId: searchParams.get('cityId') || undefined,
      districtIds: searchParams.get('districtIds')?.split(',').filter(Boolean),
      technologies: searchParams.get('technologies')?.split(',') as any,
      minSpeedMbps: searchParams.get('minSpeedMbps') 
        ? parseFloat(searchParams.get('minSpeedMbps')!)
        : undefined,
      maxSpeedMbps: searchParams.get('maxSpeedMbps')
        ? parseFloat(searchParams.get('maxSpeedMbps')!)
        : undefined,
      minPriceMonthly: searchParams.get('minPriceMonthly')
        ? parseFloat(searchParams.get('minPriceMonthly')!)
        : undefined,
      maxPriceMonthly: searchParams.get('maxPriceMonthly')
        ? parseFloat(searchParams.get('maxPriceMonthly')!)
        : undefined,
      maxContractLength: searchParams.get('maxContractLength')
        ? parseInt(searchParams.get('maxContractLength')!, 10)
        : undefined,
      campaignFlags: {
        freeModem: searchParams.get('freeModem') === 'true',
        freeInstallation: searchParams.get('freeInstallation') === 'true',
        noContract: searchParams.get('noContract') === 'true',
        limitedTime: searchParams.get('limitedTime') === 'true',
      },
    };

    // Parse sort options
    const sortOptions: TariffSortOptions = {
      sortBy: (searchParams.get('sortBy') as any) || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
    };

    // Validate criteria
    const validation = validateSafe(tariffFilterSchema, criteria);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid filter criteria',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const tariffService = new TariffService();
    const tariffs = await tariffService.findTariffs(validation.data, sortOptions);

    return NextResponse.json({
      success: true,
      data: {
        tariffs,
        total: tariffs.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch tariffs', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
