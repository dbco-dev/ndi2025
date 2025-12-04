import { useState } from 'react'
import Desktop from './components/blocks/desktop'
import AppIcon from './components/blocks/appIcon'
import TopBar from './components/blocks/topBar'
import Window from './components/blocks/window'

function App() {
  const [openApps, setOpenApps] = useState<[uuid: number, title: string, x: number, y: number][]>([[1, "Notepad", 200, 200], [2, "Calculator", 300, 300], [3, "Paint", 400, 400]])

  function timestamp() {
    return Date.now();
  }

  const handleOpenApp = () => {
    setOpenApps(prev => [...prev, [timestamp(), "App", 200, 200] as [number, string, number, number]])
  }

  const handleCloseWindow = (uuid: number) => {
    setOpenApps(prev => prev.filter(app => app[0] !== uuid))
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
      <AppIcon onOpenApp={handleOpenApp} />
      <TopBar />
      {openApps.map((app) => (
        <Window key={app[0]} uuid={app[0]} title={app[1]} initialPosition={{ x: app[2], y: app[3] }} initialSize={{ width: 300, height: 200 }} onClose={() => handleCloseWindow(app[0])}>
          <div className="w-full h-full"></div>
        </Window>
      ))}
    </div>
  )
}

export default App