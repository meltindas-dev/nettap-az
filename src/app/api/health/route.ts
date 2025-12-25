import { NextResponse } from 'next/server';
import { config, validateConfig } from '@/lib/config';
import { RepositoryContainer } from '@/repositories';

/**
 * GET /api/health
 * Health check endpoint with environment and database status
 */
export async function GET() {
  const validation = validateConfig();
  const dbType = config.database.type;
  
  // Check database connectivity
  let dbStatus = 'unknown';
  try {
    if (dbType === 'memory') {
      dbStatus = 'healthy';
    } else if (dbType === 'postgres') {
      // Try to query a repository to verify connection
      const cityRepo = RepositoryContainer.getCityRepository();
      await cityRepo.findAll();
      dbStatus = 'healthy';
    } else if (dbType === 'sheets') {
      const cityRepo = RepositoryContainer.getCityRepository();
      await cityRepo.findAll();
      dbStatus = 'healthy';
    }
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  const isHealthy = validation.valid && dbStatus === 'healthy';

  return NextResponse.json(
    {
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.app.nodeEnv,
        database: {
          type: dbType,
          status: dbStatus,
        },
        config: {
          valid: validation.valid,
          errors: validation.errors,
        },
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
