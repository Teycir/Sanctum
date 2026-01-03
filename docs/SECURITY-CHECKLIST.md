# Security Checklist

## ✅ Sensitive Data Protection

### Files Excluded from Git
- ✅ `wrangler.toml` - Contains database ID
- ✅ `.env.local` - Contains API keys
- ✅ `.wrangler/` - Contains local D1 database
- ✅ `*.db` - SQLite database files
- ✅ `.dev.vars` - Development secrets
- ✅ `.prod.vars` - Production secrets

### Example Files (Safe to Commit)
- ✅ `wrangler.toml.example` - Template without secrets
- ✅ `.env.example` - Template without keys
- ✅ `schema.sql` - Database schema (no data)

### Before Committing
```bash
# Check for sensitive files
git status --porcelain | grep -E "wrangler.toml|.env|.key|.pem|.db"

# Verify gitignore
git check-ignore -v wrangler.toml .env.local .wrangler/

# Check for hardcoded secrets
git diff --cached | grep -iE "api[_-]?key|secret|password|token"
```

### Setup for New Developers
1. Copy `wrangler.toml.example` to `wrangler.toml`
2. Run `npx wrangler d1 create sanctum-keys`
3. Update `database_id` in `wrangler.toml`
4. Copy `.env.example` to `.env.local`
5. Add Pinata API key to `.env.local`

### What's Safe to Commit
- ✅ Encrypted data (vault blobs, encrypted keys)
- ✅ Database schema
- ✅ Public configuration
- ✅ Example files
- ✅ Documentation

### What's NEVER Committed
- ❌ Database IDs
- ❌ API keys
- ❌ Private keys
- ❌ Passphrases
- ❌ Database files
- ❌ Environment variables with secrets

## 🔒 Data Encryption Layers

All sensitive data is encrypted before storage:

1. **Vault Content** - Encrypted with user passphrase
2. **Key A** - Encrypted with vault ID
3. **CIDs** - Encrypted with random key
4. **Key B** - Never stored on server (URL only)

Even if the database is compromised, attackers only get encrypted data.
