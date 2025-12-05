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
      initialSize={initialSize || { width: 600, height: 400 }}
      onClose={onClose}
      onClick={onClick}
      shouldBlink={shouldBlink}
    >
      <div className="w-full h-full bg-zinc-100 text-zinc-900 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-200 border-b border-zinc-300">
          <button className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs hover:bg-zinc-50" onClick={handleZoomOut}>−</button>
          <div className="text-xs font-medium w-12 text-center">{zoom}%</div>
          <button className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs hover:bg-zinc-50" onClick={handleZoomIn}>+</button>
          <button className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs hover:bg-zinc-50" onClick={handleResetZoom}>Réinitialiser</button>
          
          <div className="ml-auto flex items-center gap-2">
            <button className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs hover:bg-zinc-50">⬅</button>
            <div className="text-xs font-medium w-16 text-center">Page {page}</div>
            <button className="px-2 py-1 bg-white border border-zinc-300 rounded text-xs hover:bg-zinc-50">➡</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-zinc-300 p-4 flex items-start justify-center">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="bg-white p-6 shadow-lg transition-transform"
          >
            <div className="w-[600px] min-h-[800px] bg-white">
              <div className="text-sm leading-6 text-zinc-900 whitespace-pre-wrap break-words">
                {snippet || '(Pas de contenu disponible)'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Window>
  )
}

export default Pdf
