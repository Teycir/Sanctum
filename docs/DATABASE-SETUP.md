# Cloudflare D1 Database Setup

## 1. Create Database

```bash
npx wrangler d1 create sanctum-keys
```

This will output something like:
```
✅ Successfully created DB 'sanctum-keys'!

[[d1_databases]]
binding = "DB"
database_name = "sanctum-keys"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## 2. Update wrangler.toml

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sanctum-keys"
database_id = "YOUR-DATABASE-ID-HERE"  # Replace with actual ID
```

## 3. Run Migrations

```bash
npx wrangler d1 execute sanctum-keys --file=./schema.sql
```

## 4. Verify Tables

```bash
npx wrangler d1 execute sanctum-keys --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected output:
- vault_keys
- vault_access_log
- banned_fingerprints

## 5. Test Locally

```bash
npm run dev
```

The D1 database will be available at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` during local development.

## 6. Deploy

```bash
npm run build
npx wrangler pages deploy out
```

## Troubleshooting

### Database not found
```bash
npx wrangler d1 list
```

### Reset database
```bash
npx wrangler d1 execute sanctum-keys --command="DROP TABLE IF EXISTS vault_keys; DROP TABLE IF EXISTS vault_access_log; DROP TABLE IF EXISTS banned_fingerprints;"
npx wrangler d1 execute sanctum-keys --file=./schema.sql
```

### View data
```bash
npx wrangler d1 execute sanctum-keys --command="SELECT * FROM vault_keys LIMIT 10"
```
