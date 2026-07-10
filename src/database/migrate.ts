import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class MigrationRunner {
  private migrationsPath = join(__dirname, 'migrations');

  private getPool(): Pool {
    if (process.env.DATABASE_URL) {
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    }
    return new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'png_wallet_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
  }

  async runMigrations() {
    console.log('Running database migrations...');
    const pool = this.getPool();

    const migrationFiles = readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = readFileSync(join(this.migrationsPath, file), 'utf-8');
      try {
        await pool.query(sql);
        console.log(`✓ Migration ${file} completed`);
      } catch (error: any) {
        // Ignore "already exists" errors so re-runs are safe
        if (error.code === '42P07' || error.code === '42710' || error.message?.includes('already exists')) {
          console.log(`⚠ ${file}: some objects already exist — skipping`);
        } else {
          console.error(`✗ Migration ${file} failed:`, error.message);
          await pool.end();
          throw error;
        }
      }
    }

    await pool.end();
    console.log('✅ All migrations completed successfully!');
  }
}

if (require.main === module) {
  const runner = new MigrationRunner();
  runner.runMigrations()
    .then(() => {
      console.log('Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error.message);
      process.exit(1);
    });
}
