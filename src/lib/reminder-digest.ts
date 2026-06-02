import { createClient } from '@supabase/supabase-js'

// Reminder email digest. Built to be fully testable WITHOUT an email provider:
// buildDigest() computes the data, and sendDigest() falls back to a dry-run
// (sends nothing, reports what it would send) unless RESEND_API_KEY is set.

export type DigestReminder = {
  id: string
  title: string
  due_date: string
  client: string | null
  overdue: boolean
}

export type Digest = {
  today: string
  recipients: string[]
  reminders: DigestReminder[]
}

/** Service-role client — runs outside a user session (cron context), bypasses RLS. */
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Collect open reminders due on/before `today` + the owner recipient list. */
export async function buildDigest(today: string): Promise<Digest | null> {
  const sb = serviceClient()
  if (!sb) return null

  const [remRes, ownersRes] = await Promise.all([
    sb
      .from('reminders')
      .select('id, title, due_date, client_id, clients(name)')
      .eq('done', false)
      .lte('due_date', today)
      .order('due_date', { ascending: true }),
    sb.from('profiles').select('email').eq('role', 'owner'),
  ])

  const reminders: DigestReminder[] = (remRes.data ?? []).map((r) => {
    const c = r.clients as unknown as { name: string } | { name: string }[] | null
    const client = Array.isArray(c) ? (c[0]?.name ?? null) : (c?.name ?? null)
    return { id: r.id, title: r.title, due_date: r.due_date, client, overdue: r.due_date < today }
  })

  const recipients = (ownersRes.data ?? [])
    .map((o) => o.email)
    .filter((e): e is string => Boolean(e))

  return { today, recipients, reminders }
}

export function renderDigestText(d: Digest): string {
  if (d.reminders.length === 0) return 'No reminders due today. 🎉'
  return d.reminders
    .map(
      (r) =>
        `• ${r.overdue ? '[OVERDUE] ' : ''}${r.title}${r.client ? ` — ${r.client}` : ''} (due ${r.due_date})`,
    )
    .join('\n')
}

export function renderDigestHtml(d: Digest): string {
  const rows = d.reminders
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          ${r.overdue ? '<span style="color:#D94040;font-weight:600;">OVERDUE</span> ' : ''}${r.title}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;">${r.client ?? '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;white-space:nowrap;">${r.due_date}</td>
      </tr>`,
    )
    .join('')
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;">
      <h2 style="margin:0 0 4px;">FrontierOS — reminders due</h2>
      <p style="color:#666;margin:0 0 16px;">${d.today}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
    </div>`
}

/**
 * Send the digest to every recipient via Resend. No-op dry run when there's no
 * API key, no recipients, or nothing due — so wiring can be tested safely.
 */
export async function sendDigest(d: Digest): Promise<{ sent: number; dryRun: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.REMINDER_FROM_EMAIL || 'FrontierOS <onboarding@resend.dev>'

  if (!apiKey || d.recipients.length === 0 || d.reminders.length === 0) {
    return { sent: 0, dryRun: true }
  }

  const subject = `FrontierOS — ${d.reminders.length} reminder(s) due`
  const html = renderDigestHtml(d)
  let sent = 0

  for (const to of d.recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html, text: renderDigestText(d) }),
    })
    if (res.ok) sent++
  }

  return { sent, dryRun: false }
}
