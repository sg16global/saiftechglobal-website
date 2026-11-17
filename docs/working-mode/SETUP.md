# Saif Tech Global LLC — AI-operated company: setup and operations

The company AI runs **Working Mode** (`/working-mode`) and the **Centralized 24/7 Helpline** (`/helpline`) on its own, day and night. The **Admin Panel** (`/admin`) is an observer window: no approvals, no manual pricing.

It is completely independent of SG16 Central Brain. No binding, key or URL of that project is used.

## How the company works (end to end)

| Step | Who | What happens |
|---|---|---|
| 1. Conversation | Company AI | The visitor is greeted and describes the idea. No sign-in is needed. |
| 2. Brief | Company AI → client | The AI writes a structured brief and asks "Is this what you had in mind?" Nothing proceeds until the client confirms. If the work is outside what can be built and verified automatically, the AI says so and offers a buildable alternative. |
| 3. Design | Company AI → client | A visual mock-up for anything with screens, otherwise a solution outline. The client approves it or asks for changes (up to 5 revisions). |
| 4. Price | AI pricing desk | Priced by real value plus effort. **$10 minimum, no maximum, no approval.** The pricing AI sees only the approved brief, never the raw chat, so clients cannot talk the price down. |
| 5. Payment | Client | Sign in with an email code, then pay the full price through Dodo. The payment is verified server-side, and the webhook signature is checked. |
| 6. Build | Build runner | The QA AI writes acceptance tests **first**. They are frozen, and must fail on an empty project. The developer AI writes the code, and the tests run in an isolated sandbox with no internet. |
| 7. Retry | Build runner | On failure, the AI fixes the code using the test output and runs the tests again, **up to 3 more times**. |
| 8a. Delivery | Company AI | Tests pass: the client downloads a zip with a README and the tests, and receives a lifetime token `STG-M-XXXXXX`. |
| 8b. Refund | Company AI | Still failing after the retries: an **automatic full refund** through Dodo, and the client is told honestly. |
| 9. Support | Helpline AI | 24/7 for every ecosystem user. Token holders get lifetime priority, and the AI loads their delivered project (brief, design, code) so it knows it in full. Tickets are answered by the AI immediately. |

**What can be built automatically:** web and JavaScript/Node.js work: websites, web apps, browser tools, Node.js scripts and CLIs, libraries, API handlers, and integrations over HTTP, using built-in modules only. Native mobile apps, desktop installers, hardware, and anything that needs third-party accounts are declined honestly, with a buildable alternative offered.

## Architecture

```
saiftechglobal (Cloudflare Pages)                stg-company-runner (Worker)
  /working-mode  /helpline  /admin                 BuildJob Durable Object (one per project)
  functions/api/* ─ server/*.js                      ├─ alarm-driven steps (persistent, resumable)
     ├─ engagements.js  chat → brief → design → price ├─ Container sandbox: Node 24, internet OFF
     ├─ payments.js     Dodo checkout, webhooks,       ├─ server/builder.js: tests-first → code → test
     │                  refunds ── service binding ──► │   → retry ×3 → deliver + STG-M | auto-refund
     ├─ helpline.js     24/7 AI + member context      └─ cron every 10 min: restart stalled builds,
     └─ admin.js        observer panel                     retry refunds
        D1 stg-company-db  ◄──────── shared ────────────────┘
        Workers AI (chat model + code model, fallbacks)
```

## One-time production setup

Run these from the site folder.

1. **Plan:** the build sandbox uses Cloudflare Containers, which require the **Workers Paid** plan.

2. **Database**
   ```bash
   npx wrangler d1 create stg-company-db
   ```
   Paste the id into **both** `wrangler.toml` and `runner/wrangler.toml`, then:
   ```bash
   npx wrangler d1 migrations apply stg-company-db --remote
   ```

3. **Shared runner secret.** Generate one random value and set it in both projects:
   ```bash
   npx wrangler pages secret put RUNNER_SECRET --project-name saiftechglobal
   ```
   ```bash
   npx wrangler secret put RUNNER_SECRET -c runner/wrangler.toml
   ```

4. **Payments (Dodo Payments; start with test keys)**
   1. Create one **one-time** product, "Saif Tech Global — Project Payment", in USD, and enable **Pay What You Want** with a minimum of $1. The server sends the exact AI price, which is always at least $10.
   2. Add a webhook endpoint `https://saiftechglobal.com/api/payments/dodo-webhook` for the events `payment.succeeded`, `payment.failed`, `payment.cancelled`, `payment.processing`, `refund.succeeded` and `refund.failed`.
   3. Set the website secrets:
      ```bash
      npx wrangler pages secret put DODO_API_KEY --project-name saiftechglobal
      ```
      ```bash
      npx wrangler pages secret put DODO_PRODUCT_ID --project-name saiftechglobal
      ```
      ```bash
      npx wrangler pages secret put DODO_WEBHOOK_SECRET --project-name saiftechglobal
      ```
   4. The runner needs the API key too, to issue refunds:
      ```bash
      npx wrangler secret put DODO_API_KEY -c runner/wrangler.toml
      ```
   5. Keep `DODO_MODE = "test"` in both config files until a full test purchase and a test refund work. **Never** set `DODO_API_BASE` in production; it exists only for the automated tests.

5. **Email codes and notifications (Resend)**
   1. Verify the domain `saiftechglobal.com` in Resend.
   2. Set `RESEND_API_KEY` in both projects:
      ```bash
      npx wrangler pages secret put RESEND_API_KEY --project-name saiftechglobal
      ```
      ```bash
      npx wrangler secret put RESEND_API_KEY -c runner/wrangler.toml
      ```

6. **Owner sign-in (Cloudflare Access)**
   1. In **Zero Trust → Access → Applications**, add a Self-hosted application on `saiftechglobal.com` with the paths `admin` and `api/admin`, and allow the owner's email.
   2. Put the AUD tag, team domain and owner email into `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN` and `OWNER_EMAILS` in `wrangler.toml`.

7. **Deploy the build runner.** This requires **Docker** running on the machine that deploys, because Wrangler builds `runner/Dockerfile`:
   ```bash
   npx wrangler deploy -c runner/wrangler.toml
   ```
   The container part follows Cloudflare's 2026 Sandbox/Containers documentation (`scheduling_policy = "durable_object"`, `ctx.container.exec`). It is the one piece that could not be run on the development machine, which has no Docker, so verify it with a $10 test order in Dodo test mode.

8. **Deploy the website.** The Pages project is connected to GitHub (`sg16global/saiftechglobal-website`), so commit this folder there. The `RUNNER` service binding in `wrangler.toml` connects the website to the runner.

9. **Go live**
   1. In Admin → Company policy, turn **Online payments** on.
   2. Place a test order: chat, brief, design, price, Dodo test card, build, delivery or refund.
   3. Switch both configs to `DODO_MODE = "live"` with live keys.

10. **Helpline links on other products (optional):** the signed `?ctx=` link explained in `server/platforms.js`. Without it, `?project=` still selects the product's documentation.

## AI models — exactly two official Workers AI models

| Layer | Work | Model |
|---|---|---|
| **Gemma** | Customer chat, 24/7 Helpline, ticket answers, project brief, design mock-ups and solution outlines | `@cf/google/gemma-4-26b-a4b-it` |
| **Mistral** | Pricing, acceptance tests, code generation and fixes, final verification (`VERIFICATION.md`), delivery README | `@cf/mistralai/mistral-small-3.1-24b-instruct` |
| **Fallback** | Build attempts 3 and 4 (if Mistral's code still fails), before any automatic refund | `@cf/google/gemma-4-26b-a4b-it` |

* These two IDs are the only models the system accepts. The settings API rejects anything else.
* Every build self-checks syntax and real module imports before the acceptance tests run, and each retry receives the exact error lines.
* The chat layer normalises conversations to the user-first, alternating turns that Gemma requires.
* Gemma 4 gets extra token room for its hidden reasoning.

## Owner controls (Admin Panel)

* **Company policy:**
  * Accept new orders: an emergency pause.
  * Payments on/off.
  * Automatic refunds.
  * Minimum order: can be raised, never below $10.
  * Build retries (default 3).
  * Price validity.
  * Design revisions.
* **Projects (live):** watch every conversation, brief, design, AI price rationale, the frozen tests, and every build attempt with its full test output and files. You can nudge a stuck build or issue an emergency refund.
* **AI infrastructure:** chat model and code model with backups, timeouts, AI Gateway, daily cap, and a health check.
* **Knowledge base:** the verified facts the AI uses about the company and its products.
* **Tickets, audit log, staff.**

## Local development and tests

```bash
npx wrangler d1 migrations apply stg-company-db --local --persist-to ../wm-state
```
```bash
node tests/mock-dodo.mjs
```
```bash
node tests/local-executor.mjs
```
```bash
npx wrangler dev -c runner/wrangler.dev.toml --port 8790 --persist-to ../wm-state
```
```bash
npx wrangler pages dev . --port 8798 --persist-to ../wm-state
```
```bash
node tests/acceptance.mjs
```

* `tests/local-executor.mjs` stands in for the container sandbox on a machine without Docker, so it runs AI-written code locally. Use it only for testing.
* The acceptance suite uses real Workers AI on your account, performs a real AI build, and tests the deterministic refund path.
* `.dev.vars` and `runner/.dev.vars` are local-only and git-ignored.

## Honest limits

* **Scope of automatic delivery:** one delivery covers up to about 10 features and 15 files. Bigger ideas are split into phases, each a separate order.
* **Pricing:** AI prices vary somewhat between similar requests. The $10 floor and the pricing AI's isolation from the chat are the guardrails, and every rationale is visible in the Admin Panel.
* **Verification:** a passing test suite proves the agreed acceptance criteria, not every possible behaviour. The tests are written before the code and are delivered to the client so they can see exactly what was verified.
