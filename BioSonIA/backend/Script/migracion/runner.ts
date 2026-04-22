import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

function envOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const action = process.argv[2];

const createSql = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" varchar NOT NULL UNIQUE,
  "password_hash" varchar NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "files" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "path" varchar NOT NULL,
  "mime_type" varchar NOT NULL,
  "size" integer NOT NULL,
  "duration" double precision,
  "user_id" uuid,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS "ai_results" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "especie" varchar NOT NULL,
  "probabilidad" double precision NOT NULL,
  "top3_json" text,
  "espectrograma_base64" text,
  "espectrograma_birdnet_base64" text,
  "espectrograma_referencia_base64" text,
  "waveform_pair_base64" text,
  "metadata_json" text,
  "detections_json" text
);

CREATE TABLE IF NOT EXISTS "analyses" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "status" varchar NOT NULL,
  "file_id" uuid NOT NULL UNIQUE,
  "user_id" uuid,
  "ai_result_id" uuid UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("file_id") REFERENCES "files" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
  FOREIGN KEY ("ai_result_id") REFERENCES "ai_results" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
`;

const revertSql = `
DROP TABLE IF EXISTS "analyses" CASCADE;
DROP TABLE IF EXISTS "ai_results" CASCADE;
DROP TABLE IF EXISTS "files" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
`;

const sql = action === 'revert' ? revertSql : createSql;
const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const client = new Client({
  host: envOrThrow('DB_HOST'),
  port: Number(envOrThrow('DB_PORT')),
  user: envOrThrow('DB_USER'),
  password: envOrThrow('DB_PASSWORD'),
  database: envOrThrow('DB_NAME'),
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});

client.connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log(`Migracion ejecutada: ${action === 'revert' ? 'revert' : 'run'}`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('Error ejecutando migracion:', err);
    process.exit(1);
  })
  .finally(() => client.end());
