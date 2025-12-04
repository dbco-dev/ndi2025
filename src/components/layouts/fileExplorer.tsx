import Window from '../blocks/window'

function FileExplorer() {
    return (
        <Window title="File Explorer" initialPosition={{ x: 200, y: 200 }} initialSize={{ width: 300, height: 200 }}>
            <div className="w-full h-full">
                <h1>File Explorer</h1>
            </div>
        </Window>
    )
}

export default FileExplorer