'use client'

import { useState, useEffect, useRef } from 'react'
import { type Zone, DEFAULT_ZONES, saveZones } from '@/lib/zones'

interface Props {
  zones: Zone[]
  onClose: () => void
  onSave: (zones: Zone[]) => void
}

export default function ZoneSettingsModal({ zones, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Zone[]>(() =>
    zones.map((z) => ({ ...z, maxHR: z.maxHR === Infinity ? Infinity : z.maxHR }))
  )
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const updateLabel = (i: number, label: string) => {
    setDraft((d) => d.map((z, idx) => idx === i ? { ...z, label } : z))
  }

  const updateMaxHR = (i: number, value: string) => {
    // Last zone always stays Infinity
    if (i === draft.length - 1) return
    const num = parseInt(value)
    if (isNaN(num)) return
    setDraft((d) => d.map((z, idx) => idx === i ? { ...z, maxHR: num } : z))
  }

  const handleSave = () => {
    // Ensure last zone maxHR is Infinity
    const finalZones = draft.map((z, i) => ({
      ...z,
      maxHR: i === draft.length - 1 ? Infinity : z.maxHR,
    }))
    saveZones(finalZones)
    onSave(finalZones)
    onClose()
  }

  const handleReset = () => {
    setDraft(DEFAULT_ZONES.map((z) => ({ ...z })))
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Settings</p>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-5">HR Zone Thresholds</h2>

        <div className="space-y-3">
          {draft.map((zone, i) => {
            const prevMax = i > 0 ? draft[i - 1].maxHR : 0
            const isLast = i === draft.length - 1

            return (
              <div key={zone.key} className="flex items-center gap-3">
                {/* Color swatch */}
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ background: zone.color }}
                />

                {/* Label */}
                <input
                  type="text"
                  value={zone.label}
                  onChange={(e) => updateLabel(i, e.target.value)}
                  className="flex-1 min-w-0 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={`Zone ${i + 1} label`}
                />

                {/* Threshold */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!isLast ? (
                    <>
                      <span className="text-xs text-zinc-400 w-5 text-right">{prevMax > 0 ? `${prevMax}–` : '<'}</span>
                      <input
                        type="number"
                        value={zone.maxHR === Infinity ? '' : zone.maxHR}
                        onChange={(e) => updateMaxHR(i, e.target.value)}
                        min={prevMax + 1}
                        className="w-16 border border-zinc-200 rounded-lg px-2 py-1.5 text-sm text-zinc-800 text-right font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-zinc-400">bpm</span>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-400 font-mono">
                      &gt;{draft[i - 1]?.maxHR ?? '—'} bpm
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-[11px] text-zinc-400 mt-4">
          Each zone&apos;s upper bound defines where it ends. Zone 5 always extends to max.
        </p>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100">
          <button
            onClick={handleReset}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
