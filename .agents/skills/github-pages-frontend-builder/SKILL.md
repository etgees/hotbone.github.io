---
name: github-pages-frontend-builder
description: Guides building a pure front-end website intended for deployment to GitHub Pages, from step-by-step requirement gathering through implementation, local verification, GitHub Actions deployment setup, and post-deploy confirmation. Use this skill whenever the user asks to build, create, redesign, or deploy a static site, landing page, portfolio, documentation site, or client-only single-page app that will be hosted on GitHub Pages.
---

# GitHub Pages Frontend Builder

## Purpose
Build a front-end-only website (no server-side backend) and ship it to GitHub Pages,
while confirming requirements with the user one step at a time and verifying the
result at multiple layers (local, build, and live deployment) before declaring
the task done.

## When to Use This Skill
- The user wants a new static site, landing page, portfolio, blog, docs site, or
  small client-only web app.
- The target hosting is GitHub Pages (project page, user/org page, or custom domain
  pointed at GitHub Pages).
- No backend/server code is hosted by this project. Client-safe backend-as-a-service
  integrations (e.g. Supabase with its public anon key) are compatible with this
  skill; anything requiring a private secret key at runtime is not (see
  "Third-Party Integrations" below).

## Guiding Principles
1. **Never skip straight to code.** Gather requirements first, confirm the plan,
   then implement.
2. **Ask one question at a time** and wait for the answer before moving to the
   next question — do not bundle multiple questions into a single message.
3. **Verify in layers**: local dev check → production build check → live URL
   check after deployment. Do not report the task as complete until all three
   have passed.
4. **Pick the simplest tech stack that satisfies the requirements.** Don't
   introduce a bundler/framework unless the project's interactivity or scale
   justifies it.

## Workflow

### Phase 1 — Requirement Gathering (before writing any code)
Ask the user, one at a time, and wait for each answer:
1. **Purpose & audience** — what is this site for, and who is it for?
2. **Pages / sections needed** — get an explicit list (e.g. Home, About, Projects,
   Contact).
3. **Design preference** — style/mood, color scheme, reference sites, existing
   logo/brand assets, light/dark mode needs.
4. **Content & data** — will the user supply real copy/images, or should
   placeholder content be used for now? Any data that needs to be fetched from
   an external API (note: API keys must never be embedded client-side on a
   public static site).
5. **Tech stack preference** — offer these options and recommend plain
   HTML/CSS/JS by default unless complexity justifies more:
   - Plain HTML/CSS/JS (no build step, fastest to ship, simplest to debug)
   - A bundler/framework (Vite + React/Vue/Svelte, etc.) for componentized or
     more interactive sites
6. **Repository context** — repo name, and whether this will be a *project page*
   (`https://<user>.github.io/<repo>/`) or a *user/org page*
   (`https://<user>.github.io/`), since this changes base-path configuration.
7. **Third-party integrations** — explicitly ask whether the site needs:
   - A **membership / auth system** (e.g. Supabase) for user login, profiles, or
     saved data.
   - A **dropshipping service** integration. **Printful is the default/primary
     target** for this skill; other providers (e.g. Spocket, CJ Dropshipping)
     are supported as secondary options using the same proxy pattern.
   - A **payment gateway**. **NewebPay (藍新) is the default/primary target**
     for this skill, with a fully specified encryption/webhook recipe; ECPay
     (綠界) is supported as a secondary option using the same architecture
     but its own signing algorithm.
   For each one requested, follow up with the questions in
   "Third-Party Integrations" below before finalizing the plan.
8. **Summarize and confirm** — restate the gathered requirements back to the
   user in a short summary and get explicit confirmation before proceeding to
   planning.

### Phase 2 — Planning
- Decide the tech stack (if left to your judgment) based on the gathered
  requirements.
- Propose the file/folder structure and page list.
- State the deployment approach: **GitHub Actions**, triggered on push to the
  main branch (this skill defaults to Actions-based deployment, not a manual
  `gh-pages` branch push).
- Present a concise plan (pages, components, build tool if any, workflow file)
  and get explicit user go-ahead before writing code.

### Phase 3 — Implementation
- Scaffold the project, then build page by page / feature by feature.
- After each meaningful chunk, briefly summarize what was added and pause for
  feedback on design-affecting decisions before continuing.
- Bake in GitHub Pages constraints from the start (see Common Pitfalls below),
  in particular:
  - Use relative asset paths, or explicitly configure the base path for the
    chosen repo/page type.
  - Vite projects: set `base: '/<repo-name>/'` in `vite.config` unless deploying
    to a user/org root page or custom domain (in which case `base: '/'`).
  - CRA or similar tools: set the `homepage` field in `package.json` accordingly.
  - Client-side routed SPAs: GitHub Pages has no server rewrites. Use a
    `HashRouter`, or add a `404.html` (a copy of `index.html`) so deep links
    don't break on refresh.
  - Custom domain: remind the user to add a `CNAME` file to the published
    output and configure DNS.
  - No server-side code and no private secrets client-side — GitHub Pages is
    100% static and publicly readable.
- If the user opted into any third-party integration in Phase 1, implement it
  per the guidance below.

### Third-Party Integrations (Optional)

#### Membership / Auth System — Supabase
- Supabase is compatible with a pure static GitHub Pages site because its
  client (`@supabase/supabase-js`) talks to Supabase's hosted API directly
  from the browser — no server of your own is needed.
- Ask follow-up questions before implementing: which auth methods (email/
  password, magic link, OAuth providers like Google/GitHub), what user data
  needs to be stored, and whether any pages/content should be gated behind
  login.
- The **anon/public key** and **project URL** are safe to ship in client-side
  code/build output — they are meant to be public. Protect data with
  **Row Level Security (RLS)** policies in Supabase, not by hiding the key.
- Never use the **service role key** (or any Supabase key marked "secret") in
  frontend code — it bypasses RLS and must stay server-side only.
- For OAuth redirect URLs, remember to register the deployed GitHub Pages URL
  (including the repo sub-path for project pages) in Supabase's Auth
  settings.

#### Architecture Boundary: Direct Supabase Access vs. Edge Function Proxy
This is the single most important architectural rule for this skill — apply
it consistently across every integration:
- **Direct-from-frontend access using the anon key IS allowed** for Supabase
  Database/Auth operations that are properly governed by RLS policies. Common
  example: a public product catalog table with an
  `Enable read access for all users` RLS policy — the frontend may query it
  directly via `@supabase/supabase-js`, no proxy needed.
- **Any call to a third-party API that requires a secret credential
  (an API key, HashKey/HashIV, client secret, etc.) — such as Printful or
  NewebPay/ECPay — must go 100% through a Supabase Edge Function.** The
  frontend must never hold, embed, or directly call these providers. There
  are no exceptions for this category, even for calls that seem "read-only"
  from the provider (e.g. checking Printful catalog/stock via their
  authenticated API) — if it requires a secret, it goes through an Edge
  Function.
- Rule of thumb when unsure: *"Does reaching this data/endpoint require a
  secret the frontend shouldn't hold?"* If yes → Edge Function proxy. If the
  data is meant to be public and is protected purely by RLS → direct
  Supabase client call is fine.

#### Supabase Edge Functions — Implementation Notes
Apply these notes whenever implementing an Edge Function for this project
(payment signing, dropshipping order calls, webhooks, etc.):
- **Runtime**: Supabase Edge Functions run on **Deno**, not Node.js. Prefer
  the **Web Crypto API** (`crypto.subtle`) for hashing/encryption (SHA-256,
  AES-256-CBC, etc.); if a specific algorithm isn't convenient via Web
  Crypto, import a compatible module via `npm:crypto` or `node:crypto`
  specifiers rather than assuming plain Node.js APIs work unmodified.
- **Secrets**: store credentials (e.g. `NEWEBPAY_HASH_KEY`,
  `NEWEBPAY_HASH_IV`, `PRINTFUL_API_KEY`) in Supabase's **Edge Function
  Secrets**, and read them at runtime with `Deno.env.get('NAME')`. Never
  hard-code them in source or commit them to the repo.
- **CORS**: because the frontend is served from a `github.io` origin and
  Edge Functions run on a `supabase.co` origin, every request is
  cross-origin. Each Edge Function **must manually attach CORS headers**
  (e.g. `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`) on
  every response, and must explicitly handle the `OPTIONS` preflight
  request — otherwise the browser will block the `fetch()` call from the
  GitHub Pages frontend even if the function itself works fine.
- **Respond fast**: for webhook-receiving functions in particular, do the
  minimum necessary work before returning the response the caller expects;
  offload slower follow-up work (see Printful trigger notes below) so it
  doesn't delay that response.

#### Dropshipping Service — Printful (default) / other providers (secondary)
- **Printful is the default target** for this skill's dropshipping guidance.
  Other providers (Spocket, CJ Dropshipping, etc.) are supported as secondary
  options using the same architecture, but ask the user to confirm which
  provider before assuming Printful.
- Ask follow-up questions: is the integration **read-only** (e.g. displaying
  a product catalog) or **write/transactional** (e.g. placing orders,
  checking inventory)? Is the catalog itself mirrored into Supabase (so
  browsing can be a direct, keyless Supabase read per the Architecture
  Boundary above), or fetched live from Printful's API?
- **Printful's `/orders` API call always requires `PRINTFUL_API_KEY`** and
  therefore always goes through a Supabase Edge Function — never called
  directly from the frontend, per the Architecture Boundary rule.
- **Trigger timing**: only call Printful's order-creation API **after** the
  NewebPay (or ECPay) payment notify webhook has confirmed payment success
  *and* verified the paid amount matches the expected order total. Never
  trigger fulfillment from a front-end event or from the untrusted
  `ReturnURL` redirect.
- **Don't block the webhook response**: if the Printful call takes a while,
  do it as a fire-and-forget/background step (e.g. update order status to
  "paid" and respond to the payment gateway immediately, then continue with
  the Printful call), so the payment gateway's webhook still gets a fast
  `HTTP 200` and doesn't retry/timeout.
- **Currency**: checkout is in **TWD**, but Printful pricing/costs are in
  **USD**. When designing the order/database schema, include fields for the
  exchange rate used (and when it was captured) and leave room for
  international shipping cost, so conversion logic has somewhere to live —
  don't hard-code a single currency assumption into the schema.

#### Payment Gateway — NewebPay 藍新 (default) / ECPay 綠界 (secondary)
- **NewebPay is the default/primary target** for this skill, with a fully
  specified implementation recipe below. **ECPay is a secondary option** —
  same architecture (Edge Function signs the request, separate Edge Function
  receives the background notify), but its own algorithm
  (`CheckMacValue`, typically MD5/SHA256 over the sorted parameter string) —
  confirm with the user which gateway(s) are actually needed before
  assuming NewebPay.
- Ask follow-up questions: merchant credentials available (MerchantID,
  HashKey, HashIV)? Sandbox/testing only, or production?
- **NewebPay `TradeInfo` / `TradeSha` recipe** (must run inside a Supabase
  Edge Function — never in the frontend):
  1. Build the order parameters as a URL query string, e.g.
     `Amt=100&MerchantID=...&...`.
  2. Encrypt that string with **AES-256-CBC** using `NEWEBPAY_HASH_KEY` /
     `NEWEBPAY_HASH_IV` to produce `TradeInfo`.
  3. Wrap `TradeInfo` with the HashKey/HashIV before and after it, hash the
     result with **SHA-256**, and uppercase it to produce `TradeSha`.
  4. Return `TradeInfo`, `TradeSha`, and `MerchantID` to the frontend.
- **Frontend redirect mechanism**: the frontend dynamically builds a hidden
  `<form>` containing `MerchantID`, `TradeInfo`, `TradeSha` (and any other
  required fields), then calls `.submit()` to POST the browser to NewebPay's
  checkout URL. This form-submit approach — not a manual `fetch`/redirect —
  is required by NewebPay's checkout flow.
- **Never trust the front-end `ReturnURL`.** NewebPay's `ReturnURL` is a
  browser redirect that only brings the user back to the site — it is not
  proof of payment and must never be used to mark an order as paid. After
  landing back on the site, the frontend should **poll the Supabase order
  status** (e.g. `orders` table) until it reflects the outcome recorded by
  the webhook.
- **`NotifyURL` must point to a separate, dedicated Edge Function** distinct
  from the one that creates `TradeInfo`/`TradeSha`. Only this dedicated
  webhook function may verify the notification's checksum and write "paid"
  status to the database — no other code path should perform that write.
- **Local testing**: since `NotifyURL` must be a publicly reachable HTTPS
  endpoint, use `supabase functions serve` locally together with **ngrok** or
  **localtunnel** to expose the local Edge Function port so NewebPay's
  sandbox environment can actually deliver the notify callback during
  development.
- Use the **sandbox/staging environment** during development and switch to
  production endpoints only after the user confirms credentials and testing
  are complete.
- Remind the user that accepting real payments via NewebPay/ECPay typically
  requires a valid merchant contract (often tied to a registered business
  entity) — this is outside the agent's control and must be arranged by the
  user directly with the provider.

### Phase 4 — Local Verification (before pushing)
1. Run the project locally — a dev server for framework projects, or a simple
   static server for plain HTML (e.g. `npx serve .` or
   `python -m http.server`).
2. Check for build/console errors.
3. Visually verify key pages/interactions with a browser tool: take a
   screenshot, check layout/responsiveness, and confirm navigation/links work.
4. If there is a build step, run the production build command (e.g.
   `npm run build`) and:
   - Confirm it completes without errors.
   - Confirm the output directory structure matches what the deploy workflow
     expects.
   - Serve the **built output** (not the dev server) locally and re-check in a
     browser — dev servers and production builds can behave differently,
     especially around base paths and routing.
5. If Supabase Edge Functions are involved (payment signing, webhooks,
   dropshipping proxy), run them locally with `supabase functions serve` and
   verify each function directly (e.g. with `curl`) before wiring the
   frontend to them — check CORS headers are present and the `OPTIONS`
   preflight succeeds.
6. If a payment gateway webhook (`NotifyURL`) is involved, expose the local
   Edge Function port with **ngrok** or **localtunnel** and run an actual
   sandbox transaction end-to-end: confirm the webhook fires, the order
   status updates in Supabase, and (if applicable) the Printful order is
   only created after that confirmation.

### Phase 5 — GitHub Actions Deployment Setup
- Add a workflow file at `.github/workflows/deploy.yml`.
- Two ready-to-adapt templates are provided in this skill's `resources/`
  folder:
  - `deploy-static.yml` — no build step; uploads a folder (e.g. repo root or
    `./public`) directly as the Pages artifact.
  - `deploy-vite.yml` — installs Node dependencies, runs `npm run build`,
    uploads `dist/` as the Pages artifact (adjust the output folder name for
    other bundlers, e.g. `build/` for CRA).
- Use the official `actions/configure-pages`, `actions/upload-pages-artifact`,
  and `actions/deploy-pages` actions. Remind the user to set the repo's
  **Settings → Pages → Build and deployment → Source** to "GitHub Actions"
  (one-time manual step they must do themselves).
- Confirm the default branch name (`main` vs `master`) matches the user's repo
  before finalizing the workflow trigger.
- Commit and push the workflow. Never fabricate secrets the user hasn't
  provided.

### Phase 6 — Post-Deploy Verification
1. Confirm the workflow run succeeded (e.g. via `gh run watch`, `gh run list`,
   or by asking the user to check the Actions tab is green).
2. Determine the published URL:
   - Project page: `https://<user>.github.io/<repo>/`
   - User/org page: `https://<user>.github.io/`
   - Custom domain: as configured by the user
3. Use `curl -I` (or a fetch tool) against the live URL to confirm it returns
   `200 OK` and serves HTML, not a 404.
4. Spot-check a couple of key asset URLs (CSS/JS bundle paths, other pages) to
   catch base-path misconfiguration — the most common GitHub Pages deployment
   bug.
5. Report final status to the user with the live URL, and flag any remaining
   manual one-time steps (enabling Pages in repo settings, DNS for a custom
   domain, etc.).

## Common Pitfalls Checklist
- [ ] Asset paths broken due to a missing/incorrect `base` config
- [ ] 404 on page refresh or direct deep link (SPA routing) — needs
      `HashRouter` or a `404.html` fallback
- [ ] Case-sensitive path mismatches (GitHub Pages is case-sensitive, unlike
      local Windows dev)
- [ ] Forgot to set Pages source to "GitHub Actions" in repo settings
- [ ] Secrets/API keys committed into a public static site
- [ ] Uploaded artifact path doesn't match the actual build output folder
- [ ] Workflow trigger branch (`main`/`master`) doesn't match the repo's
      default branch
- [ ] Supabase **service role key** accidentally used/exposed client-side
      instead of the public anon key
- [ ] Missing/incorrect Row Level Security policies on Supabase tables that
      hold user data
- [ ] Dropshipping provider's secret API key called directly from the
      frontend instead of via a serverless proxy
- [ ] Supabase Auth redirect URL not updated to match the deployed GitHub
      Pages URL (including repo sub-path)
- [ ] ECPay/NewebPay HashKey/HashIV embedded in frontend code instead of
      signed server-side via a serverless function
- [ ] No public endpoint available for ECPay/NewebPay's server-to-server
      payment notification (GitHub Pages alone cannot host it)
- [ ] Using production payment gateway endpoints/credentials before sandbox
      testing is complete
- [ ] Frontend treats the `ReturnURL` redirect as proof of payment instead of
      polling the Supabase order status / relying solely on `NotifyURL`
- [ ] Payment-request signing (`TradeInfo`/`TradeSha`) and the `NotifyURL`
      webhook handler implemented in the same Edge Function instead of two
      separate, dedicated functions
- [ ] Missing CORS headers or unhandled `OPTIONS` preflight on a Supabase
      Edge Function called from the `github.io` frontend
- [ ] Node.js-only APIs used inside a Supabase Edge Function instead of Web
      Crypto / Deno-compatible equivalents
- [ ] Printful order triggered before payment is confirmed by the webhook, or
      without verifying the paid amount matches the order total
- [ ] Slow synchronous Printful call delays the webhook's `HTTP 200` response
      back to the payment gateway
- [ ] Public/keyless read-only Supabase table (e.g. product catalog) missing
      an explicit RLS "read for all" policy
- [ ] A third-party API that requires a secret (Printful, NewebPay, ECPay)
      called directly from the frontend "just for read-only/testing" instead
      of always going through an Edge Function
- [ ] No exchange-rate/international-shipping fields in the order schema to
      reconcile TWD checkout price vs. USD Printful cost

## Notes for the Agent
- Always confirm requirements and the implementation plan with the user before
  writing significant code.
- Prefer the simplest tech stack that satisfies the requirements.
- Perform all three verification layers (local, build, post-deploy) — do not
  mark the task complete until the live URL has been checked and returns a
  successful response.
- Treat the **Architecture Boundary** rule (direct Supabase access for
  RLS-protected public data vs. mandatory Edge Function proxy for any secret-
  requiring third-party call) as non-negotiable — apply it to every
  integration, not just the ones explicitly named in this document.
