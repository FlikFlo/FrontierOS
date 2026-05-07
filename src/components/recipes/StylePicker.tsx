'use client'

import { useState, useMemo } from 'react'
import { X, Search, ChevronRight } from 'lucide-react'
import { BJCP_CATEGORIES, NON_BEER_STYLES, type BeerStyle, type NonBeerStyle } from '@/lib/bjcp-styles'
import type { BeverageCategory } from '@/types/database'

interface Props {
  category: BeverageCategory
  onSelect: (style: string, styleId?: string) => void
  onClose: () => void
}

function RangeBar({ min, max, label, unit }: { min: number; max: number; label: string; unit: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: 'var(--t-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span className="t-mono" style={{ fontSize: 9.5, color: 'var(--t-2)' }}>
          {typeof min === 'number' && min < 2 ? min.toFixed(3) : min}–{typeof max === 'number' && max < 2 ? max.toFixed(3) : max} {unit}
        </span>
      </div>
    </div>
  )
}

function StyleCard({ style, onClick, selected }: { style: BeerStyle; onClick: () => void; selected: boolean }) {
  const srmColor = srmToHex(style.srm[0])
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '10px 12px', borderRadius: 8, textAlign: 'left', width: '100%',
        background: selected ? 'rgba(251,191,36,0.1)' : 'transparent',
        border: `1px solid ${selected ? 'var(--accent-edge)' : 'var(--hairline)'}`,
        cursor: 'pointer', transition: 'all .12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: srmColor, flexShrink: 0, boxShadow: `0 0 6px ${srmColor}66` }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-1)', flex: 1 }}>{style.name}</span>
        <span className="t-mono" style={{ fontSize: 10, color: 'var(--t-4)' }}>{style.id}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--t-3)', lineHeight: 1.4 }}>{style.description}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { l: 'OG', v: `${style.og[0].toFixed(3)}–${style.og[1].toFixed(3)}` },
          { l: 'IBU', v: `${style.ibu[0]}–${style.ibu[1]}` },
          { l: 'ABV', v: `${style.abv[0]}–${style.abv[1]}%` },
          { l: 'SRM', v: `${style.srm[0]}–${style.srm[1]}` },
        ].map(it => (
          <span key={it.l} className="t-mono" style={{ fontSize: 9.5, color: 'var(--t-3)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4 }}>
            <span style={{ color: 'var(--t-4)', marginRight: 3 }}>{it.l}</span>{it.v}
          </span>
        ))}
      </div>
    </button>
  )
}

function srmToHex(srm: number): string {
  const clamp = Math.max(1, Math.min(40, srm))
  const SRM_COLORS: Record<number, string> = {
    1:'#FFE699',2:'#FFD878',3:'#FFCA5A',4:'#FFBF42',5:'#FBB123',
    6:'#F8A600',7:'#F39C00',8:'#EA8F00',9:'#E58500',10:'#DE7C00',
    11:'#D77200',12:'#CF6900',13:'#CB6100',14:'#C35900',15:'#BB5100',
    16:'#B54C00',17:'#B04500',18:'#A63E00',19:'#A13700',20:'#9B3200',
    21:'#952D00',22:'#8E2900',23:'#882300',24:'#821E00',25:'#7B1A00',
    26:'#771900',27:'#701400',28:'#6A0E00',29:'#660D00',30:'#5E0B00',
    31:'#5A0A02',32:'#560A05',33:'#520907',34:'#4C0505',35:'#470303',
    36:'#440100',37:'#3F0100',38:'#3B0100',39:'#360100',40:'#320100',
  }
  return SRM_COLORS[Math.round(clamp)] ?? '#FFE699'
}

export function StylePicker({ category, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const isBeer = category === 'beer' || category === 'kvass'

  // Non-beer styles
  const nonBeerStyles = NON_BEER_STYLES[category as keyof typeof NON_BEER_STYLES] ?? []

  // Filtered beer styles
  const filteredCats = useMemo(() => {
    if (!search) return BJCP_CATEGORIES
    const q = search.toLowerCase()
    return BJCP_CATEGORIES.map(cat => ({
      ...cat,
      styles: cat.styles.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.styles.length > 0)
  }, [search])

  const displayCats = activeCat && !search
    ? filteredCats.filter(c => c.id === activeCat)
    : filteredCats

  const handleSelectBeer = (style: BeerStyle) => {
    setSelected(style.id)
    onSelect(`${style.name} (${style.id})`, style.id)
    onClose()
  }

  const handleSelectNonBeer = (style: NonBeerStyle) => {
    onSelect(style.name)
    onClose()
  }

  return (
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 52, padding: 24,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 720, maxHeight: '85vh',
          background: '#111116',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', pointerEvents: 'all',
          animation: 'scaleIn .18s cubic-bezier(.16,1,.3,1)',
        }}>
          {/* Header */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--hairline)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                {isBeer ? 'Стиль пива (BJCP 2021)' : 'Категория напитка'}
              </h2>
              <button onClick={onClose} className="detail-close" style={{ position: 'static' }}><X size={15} /></button>
            </div>
            {isBeer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-4)', pointerEvents: 'none' }} />
                  <input
                    autoFocus
                    className="input"
                    style={{ paddingLeft: 32, height: 36 }}
                    placeholder="Поиск — IPA, Witbier, Stout..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveCat(null) }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Category sidebar (beer only) */}
            {isBeer && !search && (
              <div style={{
                width: 180, flexShrink: 0,
                borderRight: '1px solid var(--hairline)',
                overflowY: 'auto', padding: '10px 8px',
              }}>
                <button
                  onClick={() => setActiveCat(null)}
                  style={{
                    width: '100%', padding: '7px 10px', borderRadius: 6,
                    background: activeCat === null ? 'var(--surface-3)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    color: activeCat === null ? 'var(--t-1)' : 'var(--t-2)',
                    fontSize: 12, textAlign: 'left', marginBottom: 2,
                  }}
                >Все стили</button>
                {BJCP_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 6,
                      background: activeCat === cat.id ? 'var(--surface-3)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      color: activeCat === cat.id ? 'var(--accent)' : 'var(--t-2)',
                      fontSize: 11.5, fontWeight: activeCat === cat.id ? 600 : 400,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 1,
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ fontSize: 10, color: 'var(--t-4)' }}>{cat.styles.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Styles list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isBeer ? (
                displayCats.length === 0
                  ? <p style={{ color: 'var(--t-3)', fontSize: 13, textAlign: 'center', padding: 32 }}>Стиль не найден</p>
                  : displayCats.map(cat => (
                    <div key={cat.id}>
                      <p className="t-eyebrow" style={{ marginBottom: 8, fontSize: 10 }}>{cat.label}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {cat.styles.map(s => (
                          <StyleCard
                            key={s.id}
                            style={s}
                            selected={selected === s.id}
                            onClick={() => handleSelectBeer(s)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {nonBeerStyles.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectNonBeer(s)}
                      style={{
                        padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                        background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                        cursor: 'pointer', transition: 'border-color .12s',
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-1)' }}>{s.name}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--t-3)', marginTop: 3, lineHeight: 1.4 }}>{s.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
