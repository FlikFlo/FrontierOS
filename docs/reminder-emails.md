# Reminder email digest

A daily email to workspace **owners** listing every reminder due today (and any
overdue). Built so the whole pipeline is testable before you connect an email
provider.

## Endpoint

`GET|POST /api/cron/reminder-digest`

- Finds open reminders (`done = false`) with `due_date <= today`.
- Recipients = `profiles` with `role = 'owner'`.
- Renders an HTML + text email.
- **Sends** via Resend if `RESEND_API_KEY` is set; otherwise returns a
  **dry-run** payload (what it *would* send) so you can verify it now:

```bash
curl http://localhost:3000/api/cron/reminder-digest
# { "today": "...", "recipients": [...], "count": 1,
#   "reminders": [...], "preview": "• [OVERDUE] …", "sent": 0, "dryRun": true }
```

## Going live (manual — needs your provider key)

1. **Resend**: create an account + API key, verify a sending domain.
2. Set in `.env.local` (see `.env.example`):
   - `RESEND_API_KEY`
   - `REMINDER_FROM_EMAIL` — e.g. `FrontierOS <reminders@yourdomain.com>`
   - `CRON_SECRET` — any long random string
3. **Schedule** a daily call. Any scheduler works; the request must include
   `Authorization: Bearer <CRON_SECRET>`. Example with Supabase `pg_cron` +
   `pg_net`:

   ```sql
   select cron.schedule(
     'reminder-digest', '0 7 * * *',
     $$ select net.http_post(
          url     := 'https://YOUR_APP/api/cron/reminder-digest',
          headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
        ); $$
   );
   ```

Swapping Resend for another provider (Postmark, SES, SMTP) only touches
`sendDigest()` in `src/lib/reminder-digest.ts`.
