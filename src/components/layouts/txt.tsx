import Window from '../blocks/window'

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
  return (
    <Window
      uuid={uuid}
      title={fileName || 'Fichier texte'}
      initialPosition={initialPosition}
      initialSize={initialSize}
      onClose={onClose}
      onClick={onClick}
      shouldBlink={shouldBlink}
    >
      <div className="w-full h-full bg-white text-zinc-900 p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-zinc-600 font-medium">{fileName}</div>
          <div className="text-xs text-zinc-500">bloc-note</div>
        </div>

        <div className="flex-1 overflow-auto bg-white border border-zinc-200 rounded-sm p-3">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-5 text-zinc-900">{snippet}</pre>
        </div>
      </div>
    </Window>
  )
}

export default Txt
