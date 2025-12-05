import { useState, useRef, useEffect } from 'react'

interface AppIconProps {
    onOpenApp: (appName: string) => void
    appName: string
    isActive: boolean
    onActivate: () => void
    label?: string
    position: { x: number, y: number }
    onPositionChange: (appName: string, position: { x: number, y: number }) => void
    gridSize: number
}

function AppIcon({ onOpenApp, appName, isActive, onActivate, label, position, onPositionChange, gridSize }: AppIconProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [hasMoved, setHasMoved] = useState(false)
    const startPositionRef = useRef({ x: 0, y: 0 })
    const iconRef = useRef<HTMLDivElement>(null)

    const handleOpenApp = (appName: string) => {
        onOpenApp(appName)
    }

    const snapToGrid = (x: number, y: number) => {
        const snappedX = Math.round(x / gridSize) * gridSize
        const snappedY = Math.round(y / gridSize) * gridSize
        return { x: snappedX, y: snappedY }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return // Seulement le bouton gauche
        
        e.stopPropagation()
        setIsDragging(true)
        setHasMoved(false)
        startPositionRef.current = { x: position.x, y: position.y }
        
        const rect = iconRef.current?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            })
        }
    }

    // Réinitialiser hasMoved quand on arrête de glisser
    useEffect(() => {
        if (!isDragging && hasMoved) {
            const timer = setTimeout(() => setHasMoved(false), 200)
            return () => clearTimeout(timer)
        }
    }, [isDragging, hasMoved])

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!iconRef.current) return

            const desktopElement = iconRef.current.closest('[data-desktop]')
            if (!desktopElement) return

            const desktopRect = desktopElement.getBoundingClientRect()
            const newX = e.clientX - desktopRect.left - dragOffset.x
            const newY = e.clientY - desktopRect.top - dragOffset.y

            const snapped = snapToGrid(newX, newY)
            
            // Détecter si l'icône a vraiment bougé
            if (Math.abs(snapped.x - startPositionRef.current.x) > 5 || Math.abs(snapped.y - startPositionRef.current.y) > 5) {
                setHasMoved(true)
            }
            
            // Empêcher de sortir du desktop
            const iconWidth = iconRef.current.offsetWidth
            const iconHeight = iconRef.current.offsetHeight
            const maxX = desktopRect.width - iconWidth
            const maxY = desktopRect.height - iconHeight

            const clampedX = Math.max(0, Math.min(snapped.x, maxX))
            const clampedY = Math.max(0, Math.min(snapped.y, maxY))
            
            const finalSnapped = snapToGrid(clampedX, clampedY)
            onPositionChange(appName, finalSnapped)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, dragOffset, appName, onPositionChange, gridSize])

    const handleClick = (e: React.MouseEvent) => {
        // Ne pas activer si on vient de déplacer l'icône
        if (hasMoved) {
            e.stopPropagation()
            return
        }
        e.stopPropagation()
        onActivate()
    }

    return (
        <div 
            ref={iconRef}
            className={`absolute h-auto w-24 px-2 pt-2 flex flex-col items-center justify-center rounded-xl cursor-move select-none ${isActive ? 'bg-gray-200/50' : ''} ${isDragging ? 'z-50 opacity-90' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            onDoubleClick={(e) => {
                if (!hasMoved) {
                    e.stopPropagation()
                    handleOpenApp(appName)
                }
            }}>
            <div className={`w-16 h-16 m-2 pointer-events-none`}>
                <img src={`/assets/medias/${appName}.png`} alt={appName} className="w-full h-full object-contain" />
            </div>
            <div className={`text-xs text-center pointer-events-none ${isActive ? 'text-black' : 'text-gray-500'}`}>{label}</div>
        </div>
    );
}

export default AppIcon;