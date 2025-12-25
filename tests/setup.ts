import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_TYPE = 'memory';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
// NODE_ENV is read-only in some environments, skip setting it
// Tests will use the current NODE_ENV or default behavior

// Helper function to get all tariffs (since interface doesn't have findAll)
export async function getAllTariffs() {
  const { RepositoryContainer } = await import('@/repositories');
  const tariffRepo = RepositoryContainer.getTariffRepository();
  return tariffRepo.findByFilter({});
}
