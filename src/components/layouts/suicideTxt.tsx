import Window from '../blocks/window'
import WeirdTextField from '../blocks/weirdTextField'

function SuicideTxt({title, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink: boolean }) {
    return (
        <Window title={title} initialPosition={{x: 50, y: 50}} initialSize={{width: 500, height: 500}} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div className="w-full h-full flex items-center justify-center relative bg-black">
                <WeirdTextField />
            </div>
        </Window>
    )
}

export default SuicideTxt;