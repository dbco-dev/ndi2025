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

	useEffect(() => {
		// Initialiser le contenu du champ éditable
		if (editorRef.current) {
			// snippet peut être du texte simple ; on l'insère en tant que texte
			editorRef.current.innerText = snippet || ''
			setHtml(editorRef.current.innerHTML)
		}
	}, [snippet])

	const handleInput = () => {
		if (editorRef.current) setHtml(editorRef.current.innerHTML)
	}

	const handleDownloadHtml = () => {
		const blob = new Blob([`<!doctype html><meta charset="utf-8"><title>${fileName}</title>${html}`], { type: 'text/html' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = (fileName || 'document') + '.html'
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<Window
			uuid={uuid}
			title={fileName || 'Document.odt'}
			initialPosition={initialPosition}
			initialSize={initialSize || { width: 560, height: 380 }}
			onClose={onClose}
			onClick={onClick}
			shouldBlink={shouldBlink}
		>
			<div className="w-full h-full bg-white text-zinc-900 p-2 flex flex-col gap-2">
				<div className="flex items-center gap-2">
					<div className="flex gap-1">
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('bold')} aria-label="Bold">B</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('italic')} aria-label="Italic">I</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('underline')} aria-label="Underline">U</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('insertUnorderedList')}>• Liste</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('insertOrderedList')}>1. Liste</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('justifyLeft')}>L</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('justifyCenter')}>C</button>
						<button className="px-2 py-1 bg-zinc-100 rounded text-xs" onClick={() => exec('justifyRight')}>R</button>
					</div>

					<div className="ml-auto flex gap-1">
						<button className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs" onClick={handleDownloadHtml}>Télécharger</button>
					</div>
				</div>

				<div className="flex-1 overflow-auto border border-zinc-200 rounded-sm">
					<div
						ref={editorRef}
						contentEditable
						onInput={handleInput}
						className="min-h-[200px] p-3 outline-none prose max-w-none whitespace-pre-wrap break-words"
						suppressContentEditableWarning
						style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace' }}
					/>
				</div>
			</div>
		</Window>
	)
}

export default Odt
