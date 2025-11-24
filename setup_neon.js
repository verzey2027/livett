// Setup script for Neon PostgreSQL Database
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://neondb_owner:npg_9ah1ASpsRwCb@ep-sweet-unit-a1ddd0ph-pooler.ap-southeast-1.aws.neon.tech/ttlive?sslmode=require';

async function setupDatabase() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read SQL file
    const sqlFile = path.join(__dirname, 'setup_postgresql.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 Running SQL setup script...');
    
    // Split by semicolon and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await client.query(statement);
        console.log('✓ Executed statement');
      } catch (err) {
        if (!err.message.includes('already exists')) {
          console.error('⚠ Error:', err.message);
        }
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n📋 Default Admin Account:');
    console.log('   Email: admin@sharkcoder.dev');
    console.log('   Password: admin1234');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

setupDatabase();
