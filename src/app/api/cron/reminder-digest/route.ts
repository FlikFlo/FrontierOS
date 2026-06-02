import { NextResponse } from 'next/server'
import { buildDigest, renderDigestText, sendDigest } from '@/lib/reminder-digest'

// Daily reminder digest endpoint, meant to be hit by a scheduler (Supabase
// pg_cron, Vercel Cron, GitHub Actions, …). Protect it by setting CRON_SECRET
// and calling with `Authorization: Bearer <CRON_SECRET>`. Without RESEND_API_KEY
// it runs as a dry-run and returns the computed digest (handy for testing).

export const dynamic = 'force-dynamic'

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const digest = await buildDigest(today)
  if (!digest) {
    return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 500 })
  }

  const result = await sendDigest(digest)

  return NextResponse.json({
    today: digest.today,
    recipients: digest.recipients,
    count: digest.reminders.length,
    reminders: digest.reminders,
    preview: renderDigestText(digest),
    ...result,
  })
}

export const GET = handle
export const POST = handle
