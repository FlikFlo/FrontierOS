import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/i18n/server'
import { formatMoney, formatDate } from '@/lib/utils'
import { ProformaActions } from '@/components/proforma/proforma-actions'

const COPY = {
  en: {
    title: 'Proforma Invoice',
    from: 'From',
    to: 'Bill to',
    number: 'Proforma N°',
    date: 'Date',
    product: 'Description',
    qty: 'Qty',
    price: 'Unit price',
    lineTotal: 'Amount',
    total: 'Total',
    note: 'This is a proforma invoice, not a tax invoice. Prices in MAD.',
    print: 'Print / Save PDF',
    back: 'Back to order',
    company: 'Frontier — Non-alcoholic beverages',
  },
  fr: {
    title: 'Facture proforma',
    from: 'Émetteur',
    to: 'Client',
    number: 'Proforma N°',
    date: 'Date',
    product: 'Désignation',
    qty: 'Qté',
    price: 'P.U.',
    lineTotal: 'Montant',
    total: 'Total',
    note: 'Ceci est une facture proforma, sans valeur fiscale. Prix en MAD.',
    print: 'Imprimer / Enregistrer PDF',
    back: 'Retour à la commande',
    company: 'Frontier — Boissons sans alcool',
  },
} as const

export default async function ProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()
  const locale = (await getLocale()) === 'fr' ? 'fr' : 'en'
  const c = COPY[locale]

  const { data: order } = await supabase.from('orders').select('*').eq('id', id).single()
  if (!order) notFound()

  const [{ data: client }, { data: items }] = await Promise.all([
    order.client_id
      ? supabase.from('clients').select('name, address, email, phone').eq('id', order.client_id).single()
      : Promise.resolve({ data: null }),
    supabase.from('order_items').select('description, quantity, unit_price, product_id').eq('order_id', id),
  ])

  const lines = items ?? []
  const productIds = lines.map((l) => l.product_id).filter(Boolean) as string[]
  const productName = new Map<string, string>()
  if (productIds.length) {
    const { data: prods } = await supabase.from('products').select('id, name').in('id', productIds)
    for (const p of prods ?? []) productName.set(p.id, p.name)
  }

  const total = lines.reduce((s, l) => s + Number(l.quantity) * Number(l.unit_price), 0)
  const cur = order.currency || 'MAD'

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-3xl px-8 py-10 print:py-0">
        <ProformaActions backHref={`/orders/${id}`} printLabel={c.print} backLabel={c.back} />

        <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {c.number} {order.order_number}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">{c.company}</p>
            <p className="mt-1 text-neutral-500">
              {c.date}: {formatDate(order.order_date, locale)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-6 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">{c.from}</p>
            <p className="font-medium">{c.company}</p>
            <p className="text-neutral-500">Maroc</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">{c.to}</p>
            <p className="font-medium">{client?.name ?? '—'}</p>
            {client?.address && <p className="text-neutral-500">{client.address}</p>}
            {client?.phone && <p className="text-neutral-500">{client.phone}</p>}
            {client?.email && <p className="text-neutral-500">{client.email}</p>}
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-400">
              <th className="py-2 font-semibold">{c.product}</th>
              <th className="py-2 text-right font-semibold">{c.qty}</th>
              <th className="py-2 text-right font-semibold">{c.price}</th>
              <th className="py-2 text-right font-semibold">{c.lineTotal}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="py-2.5">
                  {l.description || (l.product_id ? productName.get(l.product_id) : null) || '—'}
                </td>
                <td className="py-2.5 text-right tabular-nums">{Number(l.quantity)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatMoney(Number(l.unit_price), cur, locale)}</td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatMoney(Number(l.quantity) * Number(l.unit_price), cur, locale)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-300">
              <td colSpan={3} className="py-3 text-right font-semibold">
                {c.total}
              </td>
              <td className="py-3 text-right text-base font-bold tabular-nums">{formatMoney(total, cur, locale)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="mt-8 border-t border-neutral-200 pt-4 text-xs text-neutral-400">{c.note}</p>
      </div>
    </div>
  )
}
