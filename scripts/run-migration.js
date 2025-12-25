#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Runs database schema migration for PostgreSQL.
 * 
 * Usage:
 *   node scripts/run-migration.js
 *   npm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { config } = require('../src/lib/config');

async function runMigration() {
  console.log('🗃️  Running database migration...\n');

  if (config.database.type !== 'postgres') {
    console.log('⚠️  Skipping migration: DATABASE_TYPE is not postgres');
    console.log(`   Current type: ${config.database.type}\n`);
    process.exit(0);
  }

  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    console.log(`📄 Reading schema from: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Run migration
    console.log('🔄 Executing migration...');
    await pool.query(schemaSql);
    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📊 Created tables:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    console.log('\n✅ Database migration complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration();
