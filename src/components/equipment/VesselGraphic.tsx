'use client'

import { useId } from 'react'
import type { EquipmentType, EquipmentStatus } from '@/lib/equipment-mock'

interface Props {
  type: EquipmentType
  fillPct?: number
  liquidColor?: string
  status: EquipmentStatus
  animate?: boolean
  bubbles?: boolean
}

const DEFAULT_LIQUID = '#f5b942'

export function VesselGraphic(props: Props) {
  const id = useId().replace(/[:]/g, '')
  const p = { ...props, id }
  switch (props.type) {
    case 'fv':             return <Fermenter {...p} />
    case 'bbt':            return <BrightTank {...p} />
    case 'hlt':            return <Kettle {...p} kind="hlt" />
    case 'bk':             return <Kettle {...p} kind="bk" />
    case 'mlt':            return <MashTun {...p} />
    case 'whirlpool':      return <Whirlpool {...p} />
    case 'heat_exchanger': return <HeatExchanger {...p} />
    case 'glycol':         return <Glycol {...p} />
    case 'co2':            return <Co2Bottle {...p} />
    case 'cip':            return <CipStation {...p} />
    case 'control':        return <ControlPanel {...p} />
    case 'pump':           return <Pump {...p} />
    case 'keg':            return <Keg {...p} />
    case 'storage':        return <Storage {...p} />
    default:               return null
  }
}

// ────────────────── Helpers ──────────────────

interface InnerProps extends Props { id: string }

const STEEL_GRAD = (id: string) => (
  <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stopColor="#3a3a42" />
    <stop offset="35%"  stopColor="#6e6e7a" />
    <stop offset="55%"  stopColor="#a8a8b3" />
    <stop offset="75%"  stopColor="#6e6e7a" />
    <stop offset="100%" stopColor="#2a2a30" />
  </linearGradient>
)

const LIQUID_GRAD = (id: string, color: string) => (
  <linearGradient id={`${id}-liquid`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"  stopColor={color} stopOpacity="0.95" />
    <stop offset="60%" stopColor={color} stopOpacity="0.75" />
    <stop offset="100%" stopColor={color} stopOpacity="0.55" />
  </linearGradient>
)

function wavePath(width: number, amp = 2.5, baseDepth = 60) {
  const u = width / 4
  return `M 0 ${amp}
          Q ${u/2} 0 ${u} ${amp}
          T ${u*2} ${amp}
          T ${u*3} ${amp}
          T ${u*4} ${amp}
          L ${u*4} ${baseDepth}
          L 0 ${baseDepth}
          Z`
}

interface LiquidBodyProps {
  id: string
  clipId: string
  x: number; y: number; w: number; h: number
  pct: number
  color: string
  animate: boolean
  bubbles?: boolean
}

function LiquidBody({ id, clipId, x, y, w, h, pct, color, animate, bubbles }: LiquidBodyProps) {
  if (pct <= 0) return null
  const liquidH = (h * pct) / 100
  const surfaceY = y + h - liquidH
  const waveW = w * 1.4
  const waveX = x - (waveW - w) / 2

  return (
    <g clipPath={`url(#${clipId})`}>
      <rect x={x - 1} y={surfaceY + 2} width={w + 2} height={liquidH + 4} fill={`url(#${id}-liquid)`} />
      <g>
        <path d={wavePath(waveW, 2.5, liquidH + 6)} fill={color} opacity="0.85"
              transform={`translate(${waveX}, ${surfaceY - 2})`}>
          {animate && (
            <animateTransform attributeName="transform" type="translate"
              from={`${waveX} ${surfaceY - 2}`}
              to={`${waveX - waveW / 2} ${surfaceY - 2}`}
              dur="4.5s" repeatCount="indefinite" />
          )}
        </path>
        <path d={wavePath(waveW, 1.6, 4)} fill="#fff" opacity="0.18"
              transform={`translate(${waveX}, ${surfaceY - 1})`}>
          {animate && (
            <animateTransform attributeName="transform" type="translate"
              from={`${waveX} ${surfaceY - 1}`}
              to={`${waveX - waveW / 2} ${surfaceY - 1}`}
              dur="3s" repeatCount="indefinite" />
          )}
        </path>
      </g>
      {bubbles && animate && (
        <g>
          {[0, 1, 2].map(i => {
            const bx = x + (w * (0.25 + i * 0.25))
            const startY = y + h - 2
            return (
              <circle key={i} cx={bx} cy={startY} r={1.3} fill="#fff" opacity="0">
                <animate attributeName="cy" from={startY} to={surfaceY + 4} dur={`${2.4 + i * 0.5}s`}
                  repeatCount="indefinite" begin={`${i * 0.7}s`} />
                <animate attributeName="opacity" values="0;0.7;0" dur={`${2.4 + i * 0.5}s`}
                  repeatCount="indefinite" begin={`${i * 0.7}s`} />
              </circle>
            )
          })}
        </g>
      )}
    </g>
  )
}

const STATUS_TINT: Record<EquipmentStatus, string> = {
  idle:        'rgba(160,168,180,0.0)',
  in_use:      'rgba(96,165,250,0.0)',
  cip:         'rgba(251,191,36,0.18)',
  maintenance: 'rgba(248,113,113,0.18)',
  dirty:       'rgba(251,191,36,0.10)',
}

function Tint({ status, w, h }: { status: EquipmentStatus; w: number; h: number }) {
  const c = STATUS_TINT[status]
  if (!c || c === STATUS_TINT.idle) return null
  return <rect x={0} y={0} width={w} height={h} fill={c} pointerEvents="none" />
}

// ────────────────── Fermenter (FV) ──────────────────
// Cylindrical body + conical bottom + domed top, side handrail loops

function Fermenter({ id, fillPct = 0, liquidColor = DEFAULT_LIQUID, status, animate = true }: InnerProps) {
  const W = 100, H = 140
  // Body 22..78 horizontal, top dome y=12..28, body 28..98, cone 98..130, valve 130..134
  const bodyX = 22, bodyW = 56
  const innerY = 28, innerH = 90 // cone tip at 118
  const isFermenting = status === 'in_use'
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(id, liquidColor)}
        <clipPath id={`${id}-clip`}>
          {/* Inner shape: cylinder + cone */}
          <path d={`
            M ${bodyX + 1} ${innerY}
            L ${bodyX + bodyW - 1} ${innerY}
            L ${bodyX + bodyW - 1} 98
            L ${bodyX + bodyW / 2} 122
            L ${bodyX + 1} 98
            Z
          `} />
        </clipPath>
      </defs>

      {/* Top dome */}
      <ellipse cx="50" cy="20" rx="28" ry="9" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />
      <ellipse cx="50" cy="18" rx="28" ry="9" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />
      {/* Top fitting */}
      <rect x="46" y="6" width="8" height="6" rx="1" fill="#2a2a30" />
      <rect x="44" y="4" width="12" height="3" rx="1" fill="#3a3a42" />

      {/* Body cylinder */}
      <rect x={bodyX} y="18" width={bodyW} height="80" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />

      {/* Cone bottom */}
      <path d={`M ${bodyX} 98 L ${bodyX + bodyW} 98 L ${bodyX + bodyW / 2} 122 Z`}
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />
      {/* Bottom valve */}
      <rect x="48" y="122" width="4" height="6" fill="#2a2a30" />
      <rect x="44" y="128" width="12" height="3" rx="1" fill="#3a3a42" />

      {/* Liquid */}
      <LiquidBody id={id} clipId={`${id}-clip`} x={bodyX} y={innerY} w={bodyW} h={innerH}
                  pct={fillPct} color={liquidColor} animate={animate} bubbles={isFermenting && fillPct > 5} />

      {/* Handrail accents */}
      <line x1={bodyX} y1="40" x2={bodyX + bodyW} y2="40" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
      <line x1={bodyX} y1="70" x2={bodyX + bodyW} y2="70" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />

      {/* Side glow strip */}
      <rect x={bodyX + 2} y="22" width="3" height="72" fill="rgba(255,255,255,0.18)" />
      <rect x={bodyX + bodyW - 5} y="22" width="2" height="72" fill="rgba(0,0,0,0.25)" />

      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Bright Tank (BBT) ──────────────────
// Horizontal-leaning cylinder with rounded ends

function BrightTank({ id, fillPct = 0, liquidColor = DEFAULT_LIQUID, status, animate = true }: InnerProps) {
  const W = 100, H = 100
  const bodyX = 14, bodyW = 72, bodyY = 28, bodyH = 50
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(id, liquidColor)}
        <clipPath id={`${id}-clip`}>
          <rect x={bodyX + 1} y={bodyY + 1} width={bodyW - 2} height={bodyH - 2} rx="6" />
        </clipPath>
      </defs>
      {/* Top fittings */}
      <rect x="46" y="14" width="8" height="14" fill="#2a2a30" />
      <rect x="42" y="12" width="16" height="3" rx="1" fill="#3a3a42" />
      <circle cx="28" cy="22" r="3" fill="#2a2a30" />
      <circle cx="72" cy="22" r="3" fill="#2a2a30" />

      {/* Body */}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="8"
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />

      {/* End caps */}
      <ellipse cx={bodyX + 4} cy={bodyY + bodyH / 2} rx="3" ry={bodyH / 2 - 2} fill="rgba(0,0,0,0.25)" />
      <ellipse cx={bodyX + bodyW - 4} cy={bodyY + bodyH / 2} rx="3" ry={bodyH / 2 - 2} fill="rgba(0,0,0,0.25)" />

      {/* Liquid */}
      <LiquidBody id={id} clipId={`${id}-clip`} x={bodyX} y={bodyY} w={bodyW} h={bodyH}
                  pct={fillPct} color={liquidColor} animate={animate} />

      {/* Highlight */}
      <rect x={bodyX + 4} y={bodyY + 4} width={bodyW - 8} height="3" rx="1.5" fill="rgba(255,255,255,0.18)" />

      {/* Legs */}
      <rect x="22" y={bodyY + bodyH} width="3" height="14" fill="#2a2a30" />
      <rect x="75" y={bodyY + bodyH} width="3" height="14" fill="#2a2a30" />

      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Kettle (HLT, BK) ──────────────────
function Kettle({ id, fillPct = 0, liquidColor = DEFAULT_LIQUID, status, kind, animate = true }: InnerProps & { kind: 'hlt' | 'bk' }) {
  const W = 100, H = 100
  const isBoil = kind === 'bk'
  const bodyX = 18, bodyW = 64, bodyY = 32, bodyH = 50
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(id, liquidColor)}
        <clipPath id={`${id}-clip`}>
          <path d={`M ${bodyX + 1} ${bodyY + 4} L ${bodyX + bodyW - 1} ${bodyY + 4} L ${bodyX + bodyW - 1} ${bodyY + bodyH - 1} L ${bodyX + 1} ${bodyY + bodyH - 1} Z`} />
        </clipPath>
      </defs>

      {/* Steam */}
      {isBoil && animate && (
        <g opacity="0.55">
          {[0, 1, 2].map(i => (
            <circle key={i} cx={42 + i * 8} cy={20} r={3 + i * 0.5} fill="#cbd5e1" opacity="0">
              <animate attributeName="cy" from={28} to={4} dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.6}s`} />
              <animate attributeName="opacity" values="0;0.5;0" dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.6}s`} />
              <animate attributeName="r" from={2} to={5} dur={`${2.6 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.6}s`} />
            </circle>
          ))}
        </g>
      )}

      {/* Vent / stack */}
      <rect x="46" y="22" width="8" height="12" fill="#2a2a30" />
      <ellipse cx="50" cy="22" rx="4" ry="1.5" fill="#1a1a20" />

      {/* Lid dome */}
      <path d={`M ${bodyX} ${bodyY + 4} Q 50 ${bodyY - 8} ${bodyX + bodyW} ${bodyY + 4} Z`}
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />

      {/* Body */}
      <rect x={bodyX} y={bodyY + 4} width={bodyW} height={bodyH - 4} rx="2"
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />

      {/* Liquid */}
      <LiquidBody id={id} clipId={`${id}-clip`} x={bodyX} y={bodyY + 4} w={bodyW} h={bodyH - 4}
                  pct={fillPct} color={liquidColor} animate={animate} bubbles={isBoil} />

      {/* Bottom band */}
      <rect x={bodyX - 2} y={bodyY + bodyH - 2} width={bodyW + 4} height="4" fill="#1a1a20" />

      {/* Flame indicator for BK */}
      {isBoil && (
        <g transform="translate(50, 92)">
          <path d="M 0 0 Q -4 -4 -2 -8 Q 0 -4 2 -8 Q 4 -4 0 0 Z" fill="#fb923c" opacity="0.9">
            {animate && <animate attributeName="opacity" values="0.9;0.4;0.9" dur="0.8s" repeatCount="indefinite" />}
          </path>
        </g>
      )}

      {/* Side highlight */}
      <rect x={bodyX + 2} y={bodyY + 6} width="3" height={bodyH - 12} fill="rgba(255,255,255,0.18)" />

      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Mash Tun ──────────────────
// Like kettle but with a rake mechanism (rotating arm) on top
function MashTun({ id, fillPct = 0, liquidColor = '#c9a14a', status, animate = true }: InnerProps) {
  const W = 100, H = 100
  const bodyX = 18, bodyW = 64, bodyY = 36, bodyH = 46
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(id, liquidColor)}
        <clipPath id={`${id}-clip`}>
          <rect x={bodyX + 1} y={bodyY + 1} width={bodyW - 2} height={bodyH - 2} />
        </clipPath>
      </defs>

      {/* Drive motor on top */}
      <rect x="44" y="14" width="12" height="10" rx="2" fill="#2a2a30" stroke="#1a1a20" strokeWidth="0.5" />
      <rect x="48" y="22" width="4" height="14" fill="#3a3a42" />

      {/* Body */}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="2"
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />

      {/* Liquid */}
      <LiquidBody id={id} clipId={`${id}-clip`} x={bodyX} y={bodyY} w={bodyW} h={bodyH}
                  pct={fillPct} color={liquidColor} animate={animate} />

      {/* Rake arm (rotating visual) */}
      <g transform="translate(50, 60)">
        <line x1="-22" y1="0" x2="22" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <circle cx="0" cy="0" r="1.5" fill="#2a2a30" />
        {animate && (
          <animateTransform attributeName="transform" type="rotate"
            from="0 0 0" to="360 0 0" dur="6s" repeatCount="indefinite"
            additive="sum" />
        )}
      </g>

      {/* Bottom band */}
      <rect x={bodyX - 2} y={bodyY + bodyH - 2} width={bodyW + 4} height="4" fill="#1a1a20" />

      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Whirlpool ──────────────────
function Whirlpool({ id, fillPct = 0, liquidColor = DEFAULT_LIQUID, status, animate = true }: InnerProps) {
  const W = 100, H = 100
  const bodyX = 18, bodyW = 64, bodyY = 30, bodyH = 50
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(id, liquidColor)}
        <clipPath id={`${id}-clip`}>
          <rect x={bodyX + 1} y={bodyY + 1} width={bodyW - 2} height={bodyH - 2} />
        </clipPath>
      </defs>

      {/* Tangential inlet pipe */}
      <rect x="6" y="44" width="14" height="5" fill="#2a2a30" />
      <circle cx="20" cy="46.5" r="2" fill="#3a3a42" />

      {/* Top */}
      <ellipse cx="50" cy={bodyY} rx={bodyW / 2} ry="4" fill={`url(#${id}-steel)`} />

      {/* Body */}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx="2"
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />

      {/* Liquid */}
      <LiquidBody id={id} clipId={`${id}-clip`} x={bodyX} y={bodyY} w={bodyW} h={bodyH}
                  pct={fillPct} color={liquidColor} animate={animate} />

      {/* Vortex */}
      {fillPct > 5 && (
        <g transform="translate(50, 60)">
          <ellipse cx="0" cy="0" rx="14" ry="3" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" />
          <ellipse cx="0" cy="2" rx="9" ry="2" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
          {animate && (
            <animateTransform attributeName="transform" type="rotate"
              from="0 50 60" to="360 50 60" dur="4s" repeatCount="indefinite"
              additive="sum" />
          )}
        </g>
      )}

      <rect x={bodyX - 2} y={bodyY + bodyH - 2} width={bodyW + 4} height="4" fill="#1a1a20" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Heat Exchanger ──────────────────
function HeatExchanger({ id, status, animate = true }: InnerProps) {
  const W = 60, H = 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>{STEEL_GRAD(id)}</defs>
      <rect x="14" y="20" width="32" height="60" rx="2" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.5" />
      {/* Plates */}
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1="16" y1={22 + i * 4} x2="44" y2={22 + i * 4} stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" />
      ))}
      {/* Hot side (red) */}
      <rect x="6" y="24" width="6" height="3" fill="#ef4444" />
      <rect x="6" y="76" width="6" height="3" fill="#ef4444" />
      {/* Cold side (blue) */}
      <rect x="48" y="24" width="6" height="3" fill="#3b82f6" />
      <rect x="48" y="76" width="6" height="3" fill="#3b82f6" />
      {/* Flow indicators */}
      {animate && status === 'in_use' && (
        <>
          <circle cx="9" cy="50" r="1.5" fill="#ef4444">
            <animate attributeName="cy" from="24" to="76" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="51" cy="50" r="1.5" fill="#3b82f6">
            <animate attributeName="cy" from="76" to="24" dur="1.6s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Glycol Chiller ──────────────────
function Glycol({ id, status, animate = true }: InnerProps) {
  const W = 100, H = 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>{STEEL_GRAD(id)}</defs>
      <rect x="14" y="22" width="72" height="56" rx="3" fill="#23232a" stroke="#1a1a20" strokeWidth="0.6" />
      {/* Vent grilles */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x="22" y={28 + i * 8} width="56" height="3" rx="1" fill="rgba(0,0,0,0.5)" />
      ))}
      {/* Fan circle */}
      <circle cx="78" cy="34" r="6" fill="#1a1a20" />
      <g transform="translate(78,34)">
        <path d="M 0 -5 L 1.5 0 L 0 5 L -1.5 0 Z" fill="#3a3a42" />
        <path d="M -5 0 L 0 1.5 L 5 0 L 0 -1.5 Z" fill="#3a3a42" />
        {animate && status === 'in_use' && (
          <animateTransform attributeName="transform" type="rotate"
            from="0 0 0" to="360 0 0" dur="0.8s" repeatCount="indefinite" additive="sum" />
        )}
      </g>
      {/* Cooling indicator */}
      <text x="22" y="74" fill="#7dd3fc" fontSize="6" fontFamily="ui-monospace, monospace">-4°C</text>
      <rect x="14" y="78" width="72" height="6" fill="#1a1a20" />
      <rect x="22" y="84" width="6" height="8" fill="#2a2a30" />
      <rect x="72" y="84" width="6" height="8" fill="#2a2a30" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── CO₂ Bottle ──────────────────
function Co2Bottle({ status }: InnerProps) {
  const W = 50, H = 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        <linearGradient id="co2g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#1f3a5f" />
          <stop offset="50%" stopColor="#3b6fa8" />
          <stop offset="100%" stopColor="#1f3a5f" />
        </linearGradient>
      </defs>
      {/* Valve */}
      <rect x="22" y="6" width="6" height="6" fill="#3a3a42" />
      <rect x="20" y="4" width="10" height="3" rx="1" fill="#a8a8b3" />
      {/* Neck */}
      <rect x="20" y="12" width="10" height="8" fill="#2a2a30" />
      {/* Body */}
      <path d="M 12 22 Q 12 20 14 20 L 36 20 Q 38 20 38 22 L 38 88 Q 38 90 36 90 L 14 90 Q 12 90 12 88 Z"
            fill="url(#co2g)" stroke="#1a1a20" strokeWidth="0.6" />
      {/* Label */}
      <rect x="16" y="42" width="18" height="20" rx="1" fill="#fff" opacity="0.92" />
      <text x="25" y="56" textAnchor="middle" fill="#1a1a20" fontSize="9" fontWeight="700" fontFamily="system-ui">CO₂</text>
      {/* Highlight */}
      <rect x="14" y="24" width="3" height="60" fill="rgba(255,255,255,0.25)" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── CIP Station ──────────────────
function CipStation({ id, fillPct = 0, status, animate = true }: InnerProps) {
  const W = 50, H = 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(`${id}A`, '#fde68a')}
        {LIQUID_GRAD(`${id}B`, '#7dd3fc')}
        <clipPath id={`${id}-clipA`}>
          <rect x="7" y="32" width="14" height="44" />
        </clipPath>
        <clipPath id={`${id}-clipB`}>
          <rect x="29" y="32" width="14" height="44" />
        </clipPath>
      </defs>
      {/* Tank A — caustic */}
      <rect x="6" y="30" width="16" height="48" rx="2" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.5" />
      <LiquidBody id={`${id}A`} clipId={`${id}-clipA`} x={7} y={32} w={14} h={44}
                  pct={fillPct || 60} color="#fde68a" animate={animate} />
      {/* Tank B — acid (blue tint) */}
      <rect x="28" y="30" width="16" height="48" rx="2" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.5" />
      <LiquidBody id={`${id}B`} clipId={`${id}-clipB`} x={29} y={32} w={14} h={44}
                  pct={fillPct || 75} color="#7dd3fc" animate={animate} />
      {/* Top fittings */}
      <rect x="12" y="22" width="4" height="8" fill="#2a2a30" />
      <rect x="34" y="22" width="4" height="8" fill="#2a2a30" />
      <rect x="6" y="78" width="38" height="4" fill="#1a1a20" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Control Panel ──────────────────
function ControlPanel({ status, animate = true }: InnerProps) {
  const W = 100, H = 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <rect x="12" y="14" width="76" height="72" rx="4" fill="#1a1a20" stroke="#3a3a42" strokeWidth="0.8" />
      {/* Screen */}
      <rect x="20" y="22" width="60" height="32" rx="2" fill="#0a0a10" stroke="rgba(96,165,250,0.4)" strokeWidth="0.5" />
      <text x="24" y="34" fill="#60a5fa" fontSize="6" fontFamily="ui-monospace, monospace">FV-01</text>
      <text x="24" y="42" fill="#22c55e" fontSize="5" fontFamily="ui-monospace, monospace">20.5°C</text>
      <text x="24" y="50" fill="#fbbf24" fontSize="5" fontFamily="ui-monospace, monospace">SG 1.022</text>
      {/* Indicator LEDs */}
      {[0, 1, 2, 3].map(i => (
        <circle key={i} cx={24 + i * 12} cy={62} r={2} fill={i === 0 ? '#22c55e' : i === 1 ? '#fbbf24' : '#3a3a42'}>
          {animate && i < 2 && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />}
        </circle>
      ))}
      {/* Buttons */}
      <rect x="20" y="70" width="14" height="10" rx="1.5" fill="#2a2a30" />
      <rect x="38" y="70" width="14" height="10" rx="1.5" fill="#2a2a30" />
      <rect x="56" y="70" width="22" height="10" rx="1.5" fill="#fbbf24" opacity="0.85" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Pump ──────────────────
function Pump({ id, status, animate = true }: InnerProps) {
  const W = 60, H = 60
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>{STEEL_GRAD(id)}</defs>
      <circle cx="30" cy="30" r="20" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />
      <circle cx="30" cy="30" r="10" fill="#1a1a20" />
      <g transform="translate(30,30)">
        <path d="M 0 -8 L 3 0 L 0 8 L -3 0 Z" fill="#fbbf24" />
        <path d="M -8 0 L 0 -3 L 8 0 L 0 3 Z" fill="#fbbf24" opacity="0.7" />
        {animate && status === 'in_use' && (
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="0.6s" repeatCount="indefinite" additive="sum" />
        )}
      </g>
      <rect x="48" y="28" width="10" height="4" fill="#2a2a30" />
      <rect x="2" y="28" width="10" height="4" fill="#2a2a30" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Keg ──────────────────
function Keg({ id, fillPct = 0, liquidColor = DEFAULT_LIQUID, status, animate = true }: InnerProps) {
  const W = 60, H = 80
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <defs>
        {STEEL_GRAD(id)}
        {LIQUID_GRAD(id, liquidColor)}
        <clipPath id={`${id}-clip`}>
          <path d="M 14 16 Q 8 40 14 64 L 46 64 Q 52 40 46 16 Z" />
        </clipPath>
      </defs>
      {/* Top */}
      <ellipse cx="30" cy="14" rx="16" ry="3" fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.5" />
      <circle cx="30" cy="10" r="3" fill="#2a2a30" />
      {/* Body (slight bulge) */}
      <path d="M 14 16 Q 8 40 14 64 L 46 64 Q 52 40 46 16 Z"
            fill={`url(#${id}-steel)`} stroke="#1a1a20" strokeWidth="0.6" />
      <LiquidBody id={id} clipId={`${id}-clip`} x={10} y={16} w={40} h={48}
                  pct={fillPct} color={liquidColor} animate={animate} />
      {/* Bands */}
      <rect x="6" y="22" width="48" height="2" fill="rgba(0,0,0,0.4)" />
      <rect x="6" y="56" width="48" height="2" fill="rgba(0,0,0,0.4)" />
      {/* Bottom rim */}
      <ellipse cx="30" cy="66" rx="16" ry="3" fill="#1a1a20" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Storage Rack ──────────────────
function Storage({ status }: InnerProps) {
  const W = 100, H = 100
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <rect x="10" y="14" width="80" height="72" rx="2" fill="none" stroke="#3a3a42" strokeWidth="1.2" />
      {/* Shelves */}
      {[28, 46, 64, 82].map(y => (
        <line key={y} x1="10" y1={y} x2="90" y2={y} stroke="#3a3a42" strokeWidth="0.8" />
      ))}
      {/* Boxes */}
      <rect x="14" y="18" width="14" height="8" fill="#a16207" />
      <rect x="32" y="18" width="20" height="8" fill="#854d0e" />
      <rect x="56" y="18" width="14" height="8" fill="#a16207" />
      <rect x="74" y="20" width="12" height="6" fill="#7c2d12" />

      <rect x="14" y="32" width="20" height="12" fill="#854d0e" />
      <rect x="38" y="34" width="14" height="10" fill="#a16207" />
      <rect x="56" y="32" width="30" height="12" fill="#7c2d12" />

      <rect x="14" y="50" width="16" height="12" fill="#a16207" />
      <rect x="34" y="52" width="12" height="10" fill="#7c2d12" />

      <rect x="14" y="68" width="72" height="12" fill="#3a3a42" />
      <Tint status={status} w={W} h={H} />
    </svg>
  )
}

// ────────────────── Liquid color helper ──────────────────
export function liquidColorForStage(stage?: string): string {
  if (!stage) return DEFAULT_LIQUID
  const s = stage.toLowerCase()
  if (s.includes('первич'))      return '#d4923a'
  if (s.includes('вторич'))      return '#b06a2c'
  if (s.includes('карбон'))      return '#fbbf24'
  if (s.includes('зат') || s.includes('mash')) return '#c8a866'
  if (s.includes('кип') || s.includes('boil')) return '#a16207'
  if (s.includes('охл'))         return '#fbbf24'
  return DEFAULT_LIQUID
}
