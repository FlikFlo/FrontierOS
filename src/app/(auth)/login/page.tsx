import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const target = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'

  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">
        <LoginForm next={target} />
        <p className="mt-5 text-center text-[11px] tracking-wide text-white/30">
          Developed by <span className="text-white/45">Zlatko Hrvatinić</span>
        </p>
      </div>
    </main>
  )
}
