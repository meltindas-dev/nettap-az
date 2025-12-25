#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * 
 * Run this before deployment to ensure all required environment variables are set correctly.
 * 
 * Usage:
 *   node scripts/validate-env.js
 *   npm run validate:env
 */

// Note: This script uses dynamic import to work with TypeScript modules
async function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');

  try {
    // Dynamic import for ES modules
    const configModule = await import('../src/lib/config.ts');
    const { config, validateConfig } = configModule;

    const validation = validateConfig();

    if (validation.valid) {
      console.log('✅ Environment configuration is valid!\n');
      
      // Display current configuration (without sensitive values)
      console.log('Configuration Summary:');
      console.log(`  NODE_ENV: ${config.app.nodeEnv}`);
      console.log(`  PORT: ${config.app.port}`);
      console.log(`  LOG_LEVEL: ${config.app.logLevel}`);
      console.log(`  DATABASE_TYPE: ${config.database.type}`);
      console.log(`  JWT_EXPIRES_IN: ${config.auth.jwtExpiresIn}`);
      console.log(`  JWT_REFRESH_EXPIRES_IN: ${config.auth.jwtRefreshExpiresIn}`);
      
      if (config.app.nodeEnv === 'production') {
        console.log('\n⚠️  Production Mode Checks:');
        console.log(`  JWT_SECRET set: ${config.auth.jwtSecret !== 'dev-secret-change-in-production' ? '✅' : '❌'}`);
        
        if (config.database.type === 'postgres') {
          console.log(`  PostgreSQL password set: ${config.database.password ? '✅' : '❌'}`);
        }
      }
      
      console.log('\n✅ All checks passed! Ready for deployment.\n');
      process.exit(0);
    } else {
      console.error('❌ Environment configuration has errors:\n');
      validation.errors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      console.error('\n💡 Fix these errors before deploying to production.\n');
      console.error('See .env.example or .env.production.example for reference.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error validating environment:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.error('\n💡 Make sure you have built the project: npm run build');
    process.exit(1);
  }
}

// Run validation
validateEnvironment();
