import Window from '../blocks/window'

function Fils({ uuid, title, initialPosition, initialSize, onClose, onClick, shouldBlink }: { uuid: number, title: string, initialPosition: { x: number, y: number }, initialSize: { width: number, height: number }, onClose: () => void, onClick: (position: { x: number, y: number }) => void, shouldBlink: boolean }) {
    return (
        <Window title={title} initialPosition={initialPosition} initialSize={{ width: 600, height: 350 }} onClose={onClose} onClick={onClick} shouldBlink={shouldBlink}>
            <div>
            <p>Fichier 1.txt</p>
            <p>Fichier 2.jpg</p>
            <p>Document.pdf</p>
            </div>
        </Window>
    )
}

export default Fils