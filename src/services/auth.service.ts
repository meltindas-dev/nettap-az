import { LoginCredentials, AuthTokens, TokenPayload, User } from '@/domain';
import { RepositoryContainer } from '@/repositories';
import { logger, UnauthorizedError, NotFoundError, comparePassword, generateTokens, verifyRefreshToken } from '@/lib';

/**
 * Authentication service - handles login, token generation, and user authentication
 */
export class AuthService {
  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    logger.info('Login attempt', { email: credentials.email });

    const userRepo = RepositoryContainer.getUserRepository();
    const user = await userRepo.findByEmail(credentials.email);

    if (!user) {
      logger.warn('Login failed: user not found', { email: credentials.email });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      logger.warn('Login failed: user inactive', { email: credentials.email });
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await comparePassword(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login failed: invalid password', { email: credentials.email });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      ispId: user.ispId,
    };

    const tokens = generateTokens(payload);

    logger.info('Login successful', { userId: user.id, role: user.role });

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword as User,
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    logger.debug('Refreshing access token');

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify user still exists and is active
    const userRepo = RepositoryContainer.getUserRepository();
    const user = await userRepo.findById(payload.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new tokens
    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      ispId: user.ispId,
    };

    const tokens = generateTokens(newPayload);

    logger.info('Access token refreshed', { userId: user.id });

    return tokens;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    const userRepo = RepositoryContainer.getUserRepository();
    const user = await userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}
