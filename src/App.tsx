import Desktop from './components/blocks/desktop'
import TopBar from './components/blocks/topBar'

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