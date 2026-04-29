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

1. **Repository secret** (pick one name — the workflow uses whichever is set first):

   - **`EXAM_AUTH_HASH_HEX`**, or  
   - **`VITE_AUTH_HASH_HEX`**

   The **value** must be **only** the 64‑character **hex** from `npm run gen-auth-hash` (no `VITE_AUTH_HASH_HEX=`, no quotes, no line breaks). If you paste a whole `.env` line, the build will get the wrong value and the site can still show “not configured” or logins can fail.

   **Important:** add the secret under **Settings → Secrets and variables → Actions** as a **Repository** secret. Secrets added only under **Environments** (e.g. `github-pages` → **Environment** secrets) are **not** passed to the build job in this workflow.

2. In the **Build** log, open the *Build* step: you should see `Passphrase hash length: 64 (expected 64)`. If the length is not 64, fix the secret value and redeploy.
3. In **Settings → Pages**, select **GitHub Actions** once the workflow publishes successfully.
4. By default builds use **`/<repository>/`** as `VITE_PAGES_BASE` for project sites. Publish from the repository root (`/`) instead by defining repository variable **`VITE_PAGES_BASE`** with value `/`.
5. Pushes to **`main`** run `.github/workflows/deploy-pages.yml`: `npm ci`, `npm run build`, upload `dist/`, deploy via GitHub Pages.

### “Access is not configured” on the live site

The static bundle only gets the hash when the **Build** job runs with `VITE_AUTH_HASH_HEX` in its environment. The workflow sets that from **`EXAM_AUTH_HASH_HEX` or `VITE_AUTH_HASH_HEX`** (repository secrets).

- Confirm the **latest** “Deploy to GitHub Pages” run is **green** and finished **after** you added the secret. **Re-run** the workflow or push to `main` if needed.
- In the run log, the **Build** step should print `Passphrase hash length: 64 (expected 64)`.
- If the length is wrong, open the secret and replace the value with **only** the 64 hex characters (no `KEY=`, no line breaks), then redeploy.
- If you use **Environment** secrets (e.g. `github-pages`) for this, they are not used by the current build job; copy the value to a **Repository** secret or change the workflow to reference that environment.
- **Hard-refresh** the site (or disable cache) after a successful deploy; an old `index-*.js` from a previous deploy can be cached by the browser.

Local `.env` / `.env.local` files are **not** read on GitHub. Only the Actions build step matters.
