import { Pool } from 'pg';
import type { Campaign } from './rpgTypes.js';

const databaseUrl = process.env.DATABASE_URL;
const useDatabase = Boolean(databaseUrl);

export const campaignDatabaseEnabled = useDatabase;

if (process.env.NODE_ENV === 'production' && !useDatabase) {
  throw new Error('DATABASE_URL é obrigatória em produção para persistir campanhas.');
}

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : process.env.NODE_ENV === 'production',
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

const localCampaigns = new Map<string, Campaign>();

export async function initializeCampaignStore(): Promise<void> {
  if (!pool) {
    console.warn('[RPG database] DATABASE_URL ausente; campanhas ficarão apenas na memória neste ambiente local.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rpg_campaigns (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS rpg_campaigns_updated_at_idx ON rpg_campaigns (updated_at DESC)');
  console.log('[RPG database] PostgreSQL conectado e tabela de campanhas pronta.');
}

export async function listStoredCampaigns(): Promise<Campaign[]> {
  if (!pool) return Array.from(localCampaigns.values());

  const result = await pool.query<{ data: Campaign }>(
    'SELECT data FROM rpg_campaigns ORDER BY updated_at DESC',
  );
  return result.rows.map((row) => row.data);
}

export async function getStoredCampaign(id: string): Promise<Campaign | undefined> {
  if (!pool) return localCampaigns.get(id);

  const result = await pool.query<{ data: Campaign }>(
    'SELECT data FROM rpg_campaigns WHERE id = $1',
    [id],
  );
  return result.rows[0]?.data;
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  if (!pool) {
    localCampaigns.set(campaign.id, campaign);
    return;
  }

  await pool.query(
    `INSERT INTO rpg_campaigns (id, data, created_at, updated_at)
     VALUES ($1, $2::jsonb, $3::timestamptz, $4::timestamptz)
     ON CONFLICT (id) DO UPDATE
     SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [campaign.id, JSON.stringify(campaign), campaign.createdAt, campaign.updatedAt],
  );
}

export async function deleteStoredCampaign(id: string): Promise<boolean> {
  if (!pool) return localCampaigns.delete(id);

  const result = await pool.query('DELETE FROM rpg_campaigns WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}

export async function closeCampaignStore(): Promise<void> {
  await pool?.end();
}
