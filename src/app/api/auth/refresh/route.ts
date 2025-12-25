import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';
import { logger, toErrorResponse, validateSafe } from '@/lib';
import { z } from 'zod';

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateSafe(refreshSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid refresh token',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const authService = new AuthService();
    const tokens = await authService.refreshAccessToken(validation.data.refreshToken);

    return NextResponse.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    logger.error('Token refresh failed', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
