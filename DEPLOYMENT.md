### Local development

Copy `.env.example` to `.env.local` and set `VITE_AUTH_HASH_HEX` using:

```bash
npm run gen-auth-hash -- '<your team passphrase>'
```

Paste the printed hex line into `.env.local`. Optionally set `VITE_ALLOW_UNAUTH=true` during feature work to bypass the passphrase screen.

```bash
npm install
npm run dev
```

### GitHub Pages

1. Repository secret **`EXAM_AUTH_HASH_HEX`** should contain only the lowercase hex hash from `npm run gen-auth-hash`.
2. In **Settings → Pages**, select **GitHub Actions** once the workflow publishes successfully.
3. By default builds use **`/<repository>/`** as `VITE_PAGES_BASE` for project sites. Publish from the repository root (`/`) instead by defining repository variable **`VITE_PAGES_BASE`** with value `/`.
4. Pushes to **`main`** run `.github/workflows/deploy-pages.yml`: `npm ci`, `npm run build`, upload `dist/`, deploy via GitHub Pages.

### “Access is not configured” / missing `VITE_AUTH_HASH_HEX` on the live site

The passphrase hash must exist **before** `npm run build` runs in CI. That means the repository secret is missing or the deploy ran before you added it.

1. On GitHub: **Settings → Secrets and variables → Actions → New repository secret**  
   - **Name:** `EXAM_AUTH_HASH_HEX` (must match exactly)  
   - **Value:** only the **64-character hex** string printed by:
     `npm run gen-auth-hash -- 'your-team-passphrase'`
2. **Actions** → open the latest “Deploy to GitHub Pages” workflow run → **Re-run all jobs** (or push an empty commit to `main`).

Local `.env` files are not used on GitHub; only that secret (mapped to `VITE_AUTH_HASH_HEX` during the build) is.
