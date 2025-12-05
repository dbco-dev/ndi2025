import AppIcon from './appIcon'
import { useState, useEffect, useRef } from 'react'
import NirdGame from '../layouts/nirdGame'
import Mail from '../layouts/mail'
import Troll from '../layouts/troll'
import Snake from '../layouts/snake'
import Window from './window'
import Files from './files'

<<<<<<< HEAD
interface IconPosition {
    x: number
    y: number
}

const GRID_SIZE = 100
const STORAGE_KEY = 'desktop_icon_positions'

=======
>>>>>>> 9420e5467f9ad4ade4bcafede7b7661a3dfcb9ba
function Desktop() {
    const desktopRef = useRef<HTMLDivElement>(null)
    const [openApps, setOpenApps] = useState<[uuid: number, title: string, x: number, y: number][]>([])
    const [blinkingWindows, setBlinkingWindows] = useState<Set<number>>(new Set())
    const [activeIcon, setActiveIcon] = useState<string | null>(null)
    const [iconPositions, setIconPositions] = useState<Record<string, IconPosition>>({})
  
    function timestamp() {
      return Date.now();
    }
  
    const handleCloseWindow = (uuid: number) => {
      setOpenApps(prev => prev.filter(app => app[0] !== uuid))
    }
  
    const handleWindowClick = (uuid: number, position: { x: number, y: number }) => {
      setOpenApps(prev => {
        const appIndex = prev.findIndex(app => app[0] === uuid)
        if (appIndex === -1) return prev
        
        const app = prev[appIndex]
        // Ne pas changer l'UUID si la position n'a pas vraiment changé (évite le rechargement)
        // On garde le même UUID pour éviter de recréer le composant
        const updatedApp: [number, string, number, number] = [app[0], app[1], position.x, position.y]
        
        // Si la position n'a pas changé, ne pas mettre à jour
        if (app[2] === position.x && app[3] === position.y) {
          return prev
        }
        
        const newApps = [...prev]
        newApps[appIndex] = updatedApp
        return newApps
      })
    }

    const handleOpenApp = (appName: string) => {
        
        setOpenApps(prev => {
          // Vérifier si l'application est déjà ouverte
          const existingAppIndex = prev.findIndex(app => app[1] === appName)
          
          if (existingAppIndex !== -1) {
            // L'application est déjà ouverte
            const existingApp = prev[existingAppIndex]
            const isAlreadyOnTop = existingAppIndex === prev.length - 1
            
            if (isAlreadyOnTop) {
              // L'application est déjà au premier plan, déclencher l'effet de clignotement
              setBlinkingWindows(prevBlinking => new Set([...prevBlinking, existingApp[0]]))
              // Arrêter le clignotement après 1 seconde (3 clignotements)
              setTimeout(() => {
                setBlinkingWindows(prevBlinking => {
                  const newSet = new Set(prevBlinking)
                  newSet.delete(existingApp[0])
                  return newSet
                })
              }, 1000)
              return prev
            } else {
              // L'application n'est pas au premier plan, la mettre au premier plan
              const newApps = [...prev]
              // Retirer l'application de sa position actuelle
              newApps.splice(existingAppIndex, 1)
              // La remettre à la fin (premier plan)
              return [...newApps, existingApp]
            }
          } else {
            // L'application n'est pas ouverte, l'ajouter normalement
            return [...prev, [timestamp(), appName, 200, 200] as [number, string, number, number]]
          }
        })
      }
    
    // Charger les positions depuis localStorage au montage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Vérifier que toutes les icônes ont des positions valides
                const allIcons = ['NirdGame', 'Mail', 'Troll', 'Snake']
                const hasAllIcons = allIcons.every(icon => parsed[icon] && typeof parsed[icon].x === 'number' && typeof parsed[icon].y === 'number')
                
                if (hasAllIcons) {
                    setIconPositions(parsed)
                } else {
                    // Si certaines icônes manquent, initialiser avec les positions par défaut
                    initializeDefaultPositions()
                }
            } catch (e) {
                console.error('Erreur lors du chargement des positions:', e)
                initializeDefaultPositions()
            }
        } else {
            // Attendre que le DOM soit prêt avant de calculer les positions par défaut
            const timer = setTimeout(() => {
                initializeDefaultPositions()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [])

    const initializeDefaultPositions = () => {
        if (desktopRef.current) {
            const desktopRect = desktopRef.current.getBoundingClientRect()
            const centerX = desktopRect.width / 2
            const centerY = desktopRect.height / 2
            const iconSize = 96 // w-24 = 96px
            
            const defaultPositions: Record<string, IconPosition> = {
                NirdGame: {
                    x: Math.round((centerX - iconSize * 1.5) / GRID_SIZE) * GRID_SIZE,
                    y: Math.round((centerY - iconSize / 2) / GRID_SIZE) * GRID_SIZE,
                },
                Mail: {
                    x: Math.round((centerX - iconSize / 2) / GRID_SIZE) * GRID_SIZE,
                    y: Math.round((centerY - iconSize / 2) / GRID_SIZE) * GRID_SIZE,
                },
                Troll: {
                    x: Math.round((centerX + iconSize * 0.5) / GRID_SIZE) * GRID_SIZE,
                    y: Math.round((centerY - iconSize / 2) / GRID_SIZE) * GRID_SIZE,
                },
                Snake: {
                    x: Math.round((centerX - iconSize / 2) / GRID_SIZE) * GRID_SIZE,
                    y: Math.round((centerY + iconSize * 0.5) / GRID_SIZE) * GRID_SIZE,
                },
            }
            setIconPositions(defaultPositions)
        }
    }

    // Sauvegarder les positions dans localStorage quand elles changent
    useEffect(() => {
        if (Object.keys(iconPositions).length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(iconPositions))
        }
    }, [iconPositions])

    const handleIconPositionChange = (appName: string, position: IconPosition) => {
        setIconPositions(prev => ({
            ...prev,
            [appName]: position
        }))
    }

    const getIconPosition = (appName: string): IconPosition => {
        return iconPositions[appName] || { x: 0, y: 0 }
    }

    const handleDesktopClick = () => {
        setActiveIcon(null)
    }
    
    return (
        <div className="absolute w-full bottom-0 top-6 left-0">
            <AppIcon onOpenApp={handleOpenApp} appName="MainGame" />
            <AppIcon onOpenApp={handleOpenApp} appName="Mail" />
            <AppIcon onOpenApp={handleOpenApp} appName="Troll" />
            <AppIcon onOpenApp={handleOpenApp} appName="Snake" />
            <AppIcon onOpenApp={handleOpenApp} appName="Files" />
        <div 
            ref={desktopRef}
            data-desktop
            className="absolute w-full bottom-0 top-6 left-0" 
            onClick={handleDesktopClick}>
            <AppIcon 
                onOpenApp={handleOpenApp} 
                appName="NirdGame" 
                label="NirdGame.fun" 
                isActive={activeIcon === "NirdGame"} 
                onActivate={() => setActiveIcon("NirdGame")}
                position={getIconPosition("NirdGame")}
                onPositionChange={handleIconPositionChange}
                gridSize={GRID_SIZE}
            />
            <AppIcon 
                onOpenApp={handleOpenApp} 
                appName="Mail" 
                label="Mail.app" 
                isActive={activeIcon === "Mail"} 
                onActivate={() => setActiveIcon("Mail")}
                position={getIconPosition("Mail")}
                onPositionChange={handleIconPositionChange}
                gridSize={GRID_SIZE}
            />
            <AppIcon 
                onOpenApp={handleOpenApp} 
                appName="Troll" 
                label="OneTube.app" 
                isActive={activeIcon === "Troll"} 
                onActivate={() => setActiveIcon("Troll")}
                position={getIconPosition("Troll")}
                onPositionChange={handleIconPositionChange}
                gridSize={GRID_SIZE}
            />
            <AppIcon 
                onOpenApp={handleOpenApp} 
                appName="Snake" 
                label="SteveJobs.app" 
                isActive={activeIcon === "Snake"} 
                onActivate={() => setActiveIcon("Snake")}
                position={getIconPosition("Snake")}
                onPositionChange={handleIconPositionChange}
                gridSize={GRID_SIZE}
            />


      {openApps.map((app) => (
        app[1] === "NirdGame" 
        ? <NirdGame key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} /> 
        : app[1] === "Troll" 
        ? <Troll key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} /> 
        : app[1] === "Mail" 
        ? <Mail key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} /> 
        : app[1] === "Snake" 
        ? <Snake key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} /> 
        : app[1] === "Files"
        ? <Files key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} />
        : <Window key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])}>
          <div className="w-full h-full"></div>
        </Window>
      ))}
        </div>
    )
}

export default Desktop