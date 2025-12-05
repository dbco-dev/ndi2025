import { useState } from 'react'
import Window from '../blocks/window'

type PdfProps = {
  uuid?: number
  title?: string
  fileName: string
  snippet: string
  initialPosition?: { x: number; y: number }
  initialSize?: { width: number; height: number }
  onClose?: () => void
  onClick?: (position: { x: number; y: number }) => void
  shouldBlink?: boolean
}

function Pdf({ uuid, fileName, snippet, initialPosition, initialSize, onClose, onClick, shouldBlink }: PdfProps) {
  const [zoom, setZoom] = useState(100)
  const [page] = useState(1)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50))
  const handleResetZoom = () => setZoom(100)

  return (
    <Window
      uuid={uuid}
      title={fileName || 'Document.pdf'}
      initialPosition={initialPosition}
      initialSize={initialSize || { width: 520, height: 735 }}
      onClose={onClose}
      onClick={onClick}
      shouldBlink={shouldBlink}
    >
      <div className="w-full h-full bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900 flex flex-col">
        {/* Modern Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-1">
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors" 
              onClick={handleZoomOut}
              title="Réduire"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="text-sm font-semibold text-slate-700 w-14 text-center bg-slate-50 rounded px-2 py-1">{zoom}%</div>
            <button 
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors" 
              onClick={handleZoomIn}
              title="Agrandir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button 
              className="ml-2 px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors font-medium" 
              onClick={handleResetZoom}
            >
              Réinitialiser
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span>Page {page}</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-100 to-slate-200 p-4 flex items-start justify-center">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="bg-white rounded-lg shadow-2xl transition-transform duration-200"
          >
            <div className="w-[420px] bg-white shadow-inner flex flex-col" style={{ height: '594px' }}>
              {/* Page Header Decoration */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-16 flex items-center px-6 flex-shrink-0">
                <div className="text-white font-bold text-lg truncate">{fileName}</div>
              </div>
              
              {/* Content - scrollable if needed */}
              <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-700">
                <pre className="whitespace-pre-wrap break-words font-sans text-slate-700 text-xs leading-relaxed">{snippet || '(Pas de contenu disponible)'}</pre>
              </div>
              
              {/* Footer */}
              <div className="py-3 px-6 text-xs text-slate-500 flex justify-between flex-shrink-0 border-t border-slate-200 bg-slate-50">
                <span className="truncate">{fileName}</span>
                <span>Page {page}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Window>
  )
}

export default Pdf
