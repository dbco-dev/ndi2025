import Window from '../blocks/window'

function Troll({ uuid, title, initialPosition, initialSize, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink: boolean }) {
    return (
        <Window title={title} initialPosition={initialPosition} initialSize={{ width: 600, height: 350 }} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div className="w-full h-full bg-black"> 
                <video src="/troll.mp4" autoPlay loop className="w-full h-full object-cover" />
            </div>
        </Window>
    )
}

export default Troll