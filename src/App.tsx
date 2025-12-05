import { useState } from 'react'
import Desktop from './components/blocks/desktop'
import AppIcon from './components/blocks/appIcon'
import TopBar from './components/blocks/topBar'
import Window from './components/blocks/window'
import WeirdTextField from './components/blocks/weirdTextField'
import Mail from './components/layouts/mail'
import Troll from './components/layouts/troll'
import MainGame from './components/layouts/mainGame'

function App() {
  const [openApps, setOpenApps] = useState<[uuid: number, title: string, x: number, y: number][]>([])
  const [blinkingWindows, setBlinkingWindows] = useState<Set<number>>(new Set())

  function timestamp() {
    return Date.now();
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

  return (
    <div 
      style={{
        backgroundImage: `url(/win_xp.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
  }}
    className="bg-red-500 w-full h-full fixed top-0 left-0 font-ubuntu">
      <Desktop openApps={openApps.map((app) => app[1])}/>
      <AppIcon onOpenApp={handleOpenApp} appName="MainGame" />
      <AppIcon onOpenApp={handleOpenApp} appName="Mail" />
      <TopBar />
      {openApps.map((app) => (
        app[1] === "MainGame" 
        ? <MainGame key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} /> 
        : app[1] === "Mail" 
        ? <Troll key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])} /> 
        : <Window key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])} onClick={(position) => handleWindowClick(app[0], position)} shouldBlink={blinkingWindows.has(app[0])}>
          <div className="w-full h-full"></div>
        </Window>
      ))}
      <WeirdTextField />
    </div>
  )
}

export default App