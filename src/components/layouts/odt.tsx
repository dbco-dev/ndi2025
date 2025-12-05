import { useEffect, useRef, useState } from 'react'
import Window from '../blocks/window'

type OdtProps = {
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

function exec(command: string, value?: string) {
  try {
    document.execCommand(command, false, value)
  } catch (e) {
    // noop
  }
}

function Odt({ uuid, fileName, snippet, initialPosition, initialSize, onClose, onClick, shouldBlink }: OdtProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const [html, setHtml] = useState('')
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showSizeMenu, setShowSizeMenu] = useState(false)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerText = snippet || ''
      setHtml(editorRef.current.innerHTML)
    }
  }, [snippet])

  const handleInput = () => {
    if (editorRef.current) setHtml(editorRef.current.innerHTML)
  }

  const fonts = ['Arial', 'Georgia', 'Courier New', 'Verdana', 'Times New Roman']
  const sizes = ['8', '10', '12', '14', '16', '18', '20', '24', '28', '32']

  return (
    <Window
      uuid={uuid}
      title={fileName || 'Document.odt'}
      initialPosition={initialPosition}
      initialSize={initialSize || { width: 800, height: 600 }}
      onClose={onClose}
      onClick={onClick}
      shouldBlink={shouldBlink}
    >
      <div className="w-full h-full bg-white text-slate-900 flex flex-col">
        {/* Toolbar 1 - Format */}
        <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-wrap">
          {/* Font Family */}
          <div className="relative">
            <button 
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              onClick={() => setShowFontMenu(!showFontMenu)}
            >
              Aa ▼
            </button>
            {showFontMenu && (
              <div className="absolute top-full mt-1 bg-white border border-slate-300 rounded shadow-lg z-10 min-w-max">
                {fonts.map(font => (
                  <button
                    key={font}
                    className="block w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                    style={{ fontFamily: font }}
                    onClick={() => {
                      exec('fontName', font)
                      setShowFontMenu(false)
                    }}
                  >
                    {font}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size */}
          <div className="relative">
            <button 
              className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              onClick={() => setShowSizeMenu(!showSizeMenu)}
            >
              12 ▼
            </button>
            {showSizeMenu && (
              <div className="absolute top-full mt-1 bg-white border border-slate-300 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                {sizes.map(size => (
                  <button
                    key={size}
                    className="block w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                    onClick={() => {
                      exec('fontSize', size)
                      setShowSizeMenu(false)
                    }}
                  >
                    {size}pt
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 border-l border-slate-300 mx-1"></div>

          {/* Text Style Buttons */}
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('bold')}
            title="Gras"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 5h8a4 4 0 010 8H7V5zm0 9h9a4 4 0 010 8H7v-8z"/></svg>
          </button>
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('italic')}
            title="Italique"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 5v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V5h-8z"/></svg>
          </button>
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('underline')}
            title="Souligné"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 5v9a6 6 0 006 6 6 6 0 006-6V5h-3v9a3 3 0 01-3 3 3 3 0 01-3-3V5H6zm12 16H6v-1h12v1z"/></svg>
          </button>

          <div className="h-6 border-l border-slate-300 mx-1"></div>

          {/* Text Color */}
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1" 
            title="Couleur du texte"
          >
            <input 
              type="color" 
              className="w-5 h-5 cursor-pointer"
              onChange={(e) => exec('foreColor', e.target.value)}
            />
          </button>

          {/* Highlight */}
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors flex items-center gap-1" 
            title="Surlignage"
          >
            <input 
              type="color" 
              defaultValue="#FFFF00"
              className="w-5 h-5 cursor-pointer"
              onChange={(e) => exec('hiliteColor', e.target.value)}
            />
          </button>

          <div className="h-6 border-l border-slate-300 mx-1"></div>

          {/* Alignment */}
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('justifyLeft')}
            title="Aligné à gauche"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/></svg>
          </button>
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('justifyCenter')}
            title="Centré"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 4h10v2H7V4zm-4 7h18v2H3v-2zm4 7h10v2H7v-2z"/></svg>
          </button>
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('justifyRight')}
            title="Aligné à droite"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm4 7h14v2H7v-2zm-4 7h18v2H3v-2z"/></svg>
          </button>
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('justifyFull')}
            title="Justifié"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/></svg>
          </button>

          <div className="h-6 border-l border-slate-300 mx-1"></div>

          {/* Lists */}
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('insertUnorderedList')}
            title="Liste à puces"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6C3.17 4.5 2.5 5.17 2.5 6S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>
          </button>
          <button 
            className="p-1.5 rounded hover:bg-slate-100 transition-colors" 
            onClick={() => exec('insertOrderedList')}
            title="Liste numérotée"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-4h1V9H2v1h1v4zm-1-9h1.8L2 5.1V4h3V3H2v2zm5-2v2h14V3H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>
          </button>

          <div className="ml-auto"></div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="flex-1 overflow-auto p-6 outline-none text-slate-900 leading-relaxed"
          suppressContentEditableWarning
          style={{ 
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px'
          }}
        />
      </div>
    </Window>
  )
}

export default Odt