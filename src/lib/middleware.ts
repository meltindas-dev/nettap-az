import { NextRequest, NextResponse } from 'next/server';
import { TokenPayload, UserRole } from '@/domain';
import { verifyAccessToken, extractTokenFromHeader, logger, UnauthorizedError, ForbiddenError, toErrorResponse } from '@/lib';

/**
 * Authenticated request with user context
 */
export interface AuthenticatedRequest extends NextRequest {
  user: TokenPayload;
}

/**
 * Middleware options
 */
export interface AuthMiddlewareOptions {
  allowedRoles?: UserRole[];
  requireIspId?: boolean;
}

/**
 * Authentication middleware for API routes
 * Verifies JWT token and attaches user to request
 */
export function withAuth(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        logger.warn('Missing authorization token');
        throw new UnauthorizedError('Missing authorization token');
      }

      // Verify token
      const payload = verifyAccessToken(token);
      if (!payload) {
        logger.warn('Invalid or expired token');
        throw new UnauthorizedError('Invalid or expired token');
      }

      // Check role-based access
      if (options.allowedRoles && !options.allowedRoles.includes(payload.role)) {
        logger.warn('Insufficient permissions', {
          userId: payload.userId,
          role: payload.role,
          requiredRoles: options.allowedRoles,
        });
        throw new ForbiddenError('Insufficient permissions');
      }

      // Check ISP ID requirement
      if (options.requireIspId && !payload.ispId) {
        logger.warn('ISP ID required but not found', { userId: payload.userId });
        throw new ForbiddenError('ISP ID required');
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = payload;

      logger.debug('Request authenticated', {
        userId: payload.userId,
        role: payload.role,
      });

      // Call the handler with authenticated request
      return handler(authenticatedRequest, context);
    } catch (error) {
      logger.error('Authentication middleware error', error);
      const errorResponse = toErrorResponse(error);
      return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
    }
  };
}

/**
 * Admin-only middleware
 */
export function requireAdmin(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: [UserRole.ADMIN] });
}

/**
 * ISP-only middleware
 */
export function requireISP(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: [UserRole.ISP], requireIspId: true });
}

/**
 * Admin or ISP middleware
 */
export function requireAdminOrISP(
  handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(handler, { allowedRoles: [UserRole.ADMIN, UserRole.ISP] });
}

/**
 * Extract ISP ID from authenticated request
 * Throws error if user is not ISP or ISP ID is missing
 */
export function getIspIdFromRequest(request: AuthenticatedRequest): string {
  if (!request.user.ispId) {
    throw new ForbiddenError('ISP ID not found in token');
  }
  return request.user.ispId;
}

/**
 * Check if user is admin
 */
export function isAdmin(request: AuthenticatedRequest): boolean {
  return request.user.role === UserRole.ADMIN;
}

/**
 * Check if user owns the resource (for ISP users)
 */
export function checkIspOwnership(request: AuthenticatedRequest, resourceIspId: string): void {
  if (isAdmin(request)) {
    return; // Admin can access all resources
  }

  if (request.user.role === UserRole.ISP && request.user.ispId !== resourceIspId) {
    throw new ForbiddenError('You do not have permission to access this resource');
  }
}
