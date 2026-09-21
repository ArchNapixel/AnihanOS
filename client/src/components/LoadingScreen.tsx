import LeafIcon from './LeafIcon'
import './LoadingScreen.css'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <span className="loading-screen-icon">
        <LeafIcon size={28} />
      </span>
      <h1>AnihanOS</h1>
      <div className="loading-screen-spinner" />
    </div>
  )
}

export default LoadingScreen
