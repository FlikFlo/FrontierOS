import { createClient } from '@/lib/supabase/server'
import { RegisterForm } from './register-form'

type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }>

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const { invite } = await searchParams
  let role: string | null = null

  if (invite) {
    const supabase = await createClient()
    if (supabase) {
      const rpc = supabase.rpc.bind(supabase) as unknown as RpcFn
      const { data } = await rpc('invite_role', { p_token: invite })
      role = typeof data === 'string' ? data : null
    }
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">
        <RegisterForm token={invite ?? ''} role={role} />
      </div>
    </main>
  )
}
