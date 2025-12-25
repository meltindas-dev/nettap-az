import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';
import { logger, toErrorResponse, validateSafe } from '@/lib';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateSafe(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid login credentials',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const authService = new AuthService();
    const result = await authService.login(validation.data);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          ispId: result.user.ispId,
        },
        tokens: result.tokens,
      },
    });
  } catch (error) {
    logger.error('Login failed', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
