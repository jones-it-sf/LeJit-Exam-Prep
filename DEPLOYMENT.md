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
