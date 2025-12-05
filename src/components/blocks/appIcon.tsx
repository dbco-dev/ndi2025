import { useState } from 'react'

function AppIcon({ onOpenApp, appName }: { onOpenApp: (appName: string) => void, appName: string }) {
    const [isActive, setIsActive] = useState(false)

    const handleOpenApp = (appName: string) => {
        onOpenApp(appName)
    }


    return (
        <div 
        className={`h-auto relative w-24 px-2 pt-2 flex flex-col items-center justify-center ${isActive ? 'bg-gray-200' : ''}`} 
        onClick={() => setIsActive(!isActive)}
        onDoubleClick={() => handleOpenApp(appName)}>
            <div className={`w-20 h-20 border-[1px] border-black-300`}></div>
            <div className={`text-xs text-center ${isActive ? 'text-black' : 'text-gray-500'}`}>{appName}</div>
        </div>
    );
}

export default AppIcon;