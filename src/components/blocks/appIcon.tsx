import { useState } from 'react'

function AppIcon({ onOpenApp }: { onOpenApp: () => void }) {
    const [isActive, setIsActive] = useState(false)

    const handleOpenApp = () => {
        onOpenApp()
    }


    return (
        <div 
        className={`h-auto relative w-24 px-2 pt-2 flex flex-col items-center justify-center ${isActive ? 'bg-gray-200' : ''}`} 
        onClick={() => setIsActive(!isActive)}
        onDoubleClick={() => handleOpenApp()}>
            <div className={`w-20 h-20 border-[1px] border-black-300`}></div>
            <div className={`text-xs text-center ${isActive ? 'text-black' : 'text-gray-500'}`}>AppIcon</div>
        </div>
    );
}

export default AppIcon;