import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, DownloadSimple, CircleNotch } from '@phosphor-icons/react'
import { type Dataflow } from '../api/sdmx'
import { type DatasetContent } from '../data/datasetContent'
import { ChartRenderer } from './charts/ChartRenderer'
import { type ChartProps } from './charts/FallbackChart'
import { type StackedSeriesConfig } from './charts/StackedAreaChart'

interface ExportModalProps {
  flow: Dataflow
  content: DatasetContent | null
  chartData: Record<string, number | string | null>[]
  activeSeriesList: ChartProps['activeSeriesList']
  chartType: 'line' | 'bar'
  stackedSeries?: StackedSeriesConfig[]
  onClose: () => void
}

const SITE = 'umweltpuls.de'
const SOURCE = 'Umweltbundesamt (UBA) · Datenlizenz Deutschland – Namensnennung – v2.0'

export function ExportModal({
  flow, content, chartData, activeSeriesList, chartType, stackedSeries, onClose,
}: ExportModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 7)
      a.download = `UBA_${flow.id}_${date}.png`
      a.href = dataUrl
      a.click()
    } finally {
      setDownloading(false)
    }
  }

  const title = content?.displayName ?? flow.name

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <span className="text-[13px] font-semibold text-slate-700">Exportvorschau</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all cursor-pointer border-0"
              style={{ background: downloading ? '#94a3b8' : '#1B2B3A' }}
            >
              {downloading
                ? <><CircleNotch size={13} className="animate-spin" /> Wird erstellt…</>
                : <><DownloadSimple size={13} weight="bold" /> PNG herunterladen</>
              }
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Scrollable preview area */}
        <div className="overflow-y-auto flex-1 p-6 bg-slate-50">
          {/* The export card — this is what gets captured */}
          <div
            ref={cardRef}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '28px 32px 20px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              width: '100%',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6,
              }}>
                {flow.agencyID}:{flow.id} · v{flow.version}
              </div>
              <h2 style={{
                fontSize: 18, fontWeight: 800, color: '#0f172a',
                margin: 0, lineHeight: 1.2, letterSpacing: '-0.3px',
              }}>
                {title}
              </h2>
              {content?.lead && (
                <p style={{
                  fontSize: 12, color: '#64748b', lineHeight: 1.55,
                  margin: '8px 0 0', maxWidth: 560,
                }}>
                  {content.lead}
                </p>
              )}
            </div>

            {/* Chart — same component, export mode adds axis labels */}
            <div style={{ marginLeft: -8, marginRight: -8 }}>
              <ChartRenderer
                flow={flow}
                chartData={chartData}
                activeSeriesList={activeSeriesList}
                chartType={chartType}
                stackedSeries={stackedSeries}
                exportMode
              />
            </div>

            {/* Footer */}
            <div style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <span style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4 }}>
                Quelle: {SOURCE}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.05em' }}>
                {SITE}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
