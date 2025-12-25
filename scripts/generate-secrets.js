#!/usr/bin/env node

/**
 * Generate Secure Secrets
 * 
 * Generates cryptographically secure random secrets for production use.
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(bytes = 64) {
  return crypto.randomBytes(bytes).toString('base64');
}

console.log('🔐 Generating secure secrets for production...\n');

console.log('Copy these values to your .env.production file:\n');
console.log('─'.repeat(80));
console.log('\n# JWT Authentication Secret (256-bit)');
console.log(`JWT_SECRET=${generateSecret(64)}`);

console.log('\n# PostgreSQL Password (256-bit)');
console.log(`POSTGRES_PASSWORD=${generateSecret(32)}`);

console.log('\n# Alternative secrets (if needed)');
console.log(`# API_SECRET_KEY=${generateSecret(32)}`);
console.log(`# ADMIN_API_KEY=${generateSecret(32)}`);

console.log('\n' + '─'.repeat(80));
console.log('\n⚠️  IMPORTANT: Never commit these secrets to version control!');
console.log('   Store them securely in your deployment platform\'s secret manager.\n');
