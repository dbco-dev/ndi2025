import Window from './window'

function Desktop({ openApps }: { openApps: string[] }) {
    return (
        <div className="bg-red-500">
            <Window initialPosition={{ x: 800, y: 100 }} initialSize={{ width: 300, height: 200 }}>
                <div className="w-full h-full">{openApps.map((app) => app)}</div>
            </Window>
        </div>
    )
}

export default Desktop