# Chronicles RPG

## Running locally

```sh
npm install
npm run dev
```

Without `DATABASE_URL`, local development uses in-memory campaigns. They are lost when the server restarts.

## Persistent campaigns in production

The server stores full campaign state and history in PostgreSQL. At startup, it creates the `rpg_campaigns` table and its index if they do not already exist.

Configure these server environment variables in the hosting provider:

- `NODE_ENV=production`
- `DATABASE_URL`: the PostgreSQL connection string supplied by the database provider. Keep it in the provider's secret/environment settings, never in the repository.
- `GEMINI_API_KEY`: required for AI-generated campaigns and turns; the game can use its offline narrator when the AI service is unavailable.
- `GEMINI_MODEL`: optional Gemini model override; defaults to `gemini-3.8-flash`. Gemini 3 models use low thinking for quicker turn responses.
- `DATABASE_SSL=true` only if the database provider requires TLS with a custom/untrusted certificate.

`DATABASE_URL` is mandatory in production. The server will refuse to start without it instead of silently running without persistence. For Render, create a PostgreSQL database and use its connection string as `DATABASE_URL`; prefer the internal connection string when the web service and database are in the same Render region.

Campaigns created before PostgreSQL is configured are not migrated automatically from the old in-memory store.

## Publishing a free demo

The repository includes a Render Blueprint for the web service. Campaigns still need a PostgreSQL database:

1. Create a free PostgreSQL project on [Neon](https://console.neon.tech/).
2. Copy its pooled connection string (`postgresql://...`) from the Neon dashboard. Keep it private.
3. In [Render](https://dashboard.render.com/), choose **New → Blueprint**, connect this GitHub repository, and deploy `render.yaml`.
4. When Render requests `DATABASE_URL` and `GEMINI_API_KEY`, paste the Neon connection string and your Gemini API key. Enter them only in Render's secret environment-variable form; never commit them.
5. Wait for the health check to pass, then open the `onrender.com` URL shown on the Render service page.

The free Render web service sleeps after 15 minutes without traffic and can take about a minute to wake. Neon Free suspends its database after inactivity, so the first request after a pause may also be slower. Free plans and quotas can change; check each provider's current limits. Upgrade the services if you need always-on, production-grade hosting.
