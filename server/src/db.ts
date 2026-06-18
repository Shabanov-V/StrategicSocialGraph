import pg from "pg";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/socialgraph",
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      google_id     TEXT UNIQUE NOT NULL,
      email         TEXT NOT NULL,
      name          TEXT NOT NULL,
      picture       TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS graphs (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      yaml_text     TEXT NOT NULL,
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export default pool;
