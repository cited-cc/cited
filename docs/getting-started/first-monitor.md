# First monitor tutorial

This tutorial uses **mock mode** and **fictional data only**. Mock responses are labeled and must not be treated as live AI evidence.

Example domains: `cited-test.example`, `competitor-labs.example`. Example company: **Northwind Analytics** (fictional).

## 1. Start in mock mode

```bash
npm ci
npm run self-host:up
```

Confirm defaults in `.cited/config.env`:

```bash
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
MONITORING_ENABLED=true
NOTIFICATIONS_ENABLED=false
```

## 2. Create the first owner

```bash
npm run self-host:token
```

Visit `/setup`, enter the token, and create:

- Email: `owner@northwind-analytics.example`
- Workspace: `Northwind Analytics`
- Password: choose a strong local password

## 3. Add a fictional domain and brand

1. Open **Settings → Domains**
2. Add domain `cited-test.example` (reserved example domain)
3. Verify using the manual verification flow for local development
4. Confirm brand **Cited Test Brand** links to the domain

Alternatively, run `npm run db:seed` to load the canonical fictional demo workspace.

## 4. Add fictional competitors

1. Open **Settings → Workspace**
2. Add competitor domain `competitor-labs.example`
3. Save

## 5. Create prompts

Add monitored prompts such as:

| Name | Prompt text |
| --- | --- |
| AI citation tools | What is the best tool to monitor AI citations? |
| AI SEO | Best AI SEO tools for startups |

## 6. Choose surfaces

Enable surfaces your provider supports. In mock mode, all public surfaces return deterministic fictional responses:

- ChatGPT
- Gemini
- Perplexity
- Claude
- Google AI Overviews
- Google AI Mode

Surface availability for live monitoring depends on your selected provider.

## 7. Run a monitor

1. Open **Monitors**
2. Enable a prompt × surface configuration
3. Trigger a scan from the UI or wait for the worker schedule

Ensure the worker container is running (included in `self-host:up`).

## 8. Wait for the worker

The worker polls on `CITED_JOBS_WORKER_TICK_MS` (default 30s in Docker). Check logs:

```bash
npm run self-host:logs worker
```

## 9. Read citations and evidence

1. Open **Inbox**
2. Open a citation event
3. Review source URL, snippet, and evidence ledger entries

Mock events include `[MOCK]` labels in titles and snippets.

## 10. Competitor and missed-opportunity events

Filter the inbox for:

- **Competitor citation**: competitor domain cited on a related prompt
- **Missed opportunity**: competitor cited while your verified domain was absent

## 11. Save notes

1. Open **Notebook**
2. Attach a note to a citation event
3. Pin important evidence for your team

## 12. Test notifications safely

Keep notifications disabled for this tutorial. To test email locally without external delivery:

```bash
docker compose --profile mailpit up -d
```

Then set in `.cited/config.env`:

```bash
NOTIFICATIONS_ENABLED=true
CITED_EMAIL_PROVIDER=smtp
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM_EMAIL=cited@example.com
```

View captured mail in Mailpit at `http://localhost:8025`.

## 13. Move from mock to DataForSEO

When ready for live monitoring:

1. Obtain DataForSEO credentials from [DataForSEO](https://dataforseo.com/)
2. Set credentials in `.cited/config.env`
3. Switch provider:

   ```bash
   CITED_MONITORING_PROVIDER=dataforseo
   CITED_ALLOW_MOCK_PROVIDER=false
   ```

4. Restart: `npm run self-host:down && npm run self-host:up`

See [DataForSEO provider guide](../providers/dataforseo.md).

## Related

- [Mock provider](../providers/mock.md)
- [Monitoring lifecycle](../concepts/monitoring-lifecycle.md)
- [Troubleshooting](../operations/troubleshooting.md)
