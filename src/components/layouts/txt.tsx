import Window from '../blocks/window'
import { useState } from 'react'

type TxtProps = {
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

function Txt({ uuid, fileName, snippet, initialPosition, initialSize, onClose, onClick, shouldBlink }: TxtProps) {
  const [content, setContent] = useState(snippet)
  const [wordCount, setWordCount] = useState(snippet.split(/\s+/).filter(w => w.length > 0).length)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setContent(text)
    setWordCount(text.split(/\s+/).filter(w => w.length > 0).length)
  }

  return (
    <Window
      uuid={uuid}
      title={fileName || 'Fichier texte'}
      initialPosition={initialPosition}
      initialSize={initialSize || { width: 700, height: 500 }}
      onClose={onClose}
      onClick={onClick}
      shouldBlink={shouldBlink}
    >
      <div className="w-full h-full bg-white text-slate-900 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Mots:</span>
              <span className="text-sm font-semibold text-slate-900 bg-white px-3 py-1 rounded border border-slate-200">{wordCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Caractères:</span>
              <span className="text-sm font-semibold text-slate-900 bg-white px-3 py-1 rounded border border-slate-200">{content.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
              onClick={handleCopy}
              title="Copier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* File Info Bar */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-3">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{fileName}</span>
            <span className="text-slate-500"> • Fichier texte</span>
          </div>
        </div>

        {/* Editor */}
        <textarea
          value={content}
          onChange={handleContentChange}
          className="flex-1 p-6 resize-none outline-none text-slate-700 text-sm leading-relaxed"
          style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: '1.6'
          }}
          spellCheck="true"
        />

        {/* Status Bar */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
          <span>{fileName}</span>
          <span>UTF-8 • Encodé LF</span>
        </div>
      </div>
    </Window>
  )
}

export default Txt
