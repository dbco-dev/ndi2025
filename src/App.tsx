import { useState } from 'react'
import Desktop from './components/blocks/desktop'
import AppIcon from './components/blocks/appIcon'
import TopBar from './components/blocks/topBar'
import Window from './components/blocks/window'
import WeirdTextField from './components/blocks/weirdTextField'
import Mail from './components/layouts/mail'
import Troll from './components/layouts/troll'
import MainGame from './components/layouts/mainGame'
import Snake from './components/layouts/snake'

function App() {
  return (
    <div 
      style={{
        backgroundImage: `url(/assets/medias/wallpaper.avif)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
  }}
    className="bg-red-500 w-full h-full fixed top-0 left-0 font-ubuntu">
      <Desktop />
      <TopBar />
    </div>
  )
}

export default App