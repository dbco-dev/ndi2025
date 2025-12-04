import Clock from '../shorts/clock';

function TopBar() {
    return (
        <div className="bg-zinc-700 h-6 w-full fixed top-0 left-0 bg-gradient-to-b from-zinc-500 to-zinc-700">
            <div className="text-zinc-300 text-sm h-full flex items-center justify-center">
                <Clock />
            </div>
        </div>
    )
}

export default TopBar;