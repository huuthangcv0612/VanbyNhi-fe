import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initTouchZoomLock } from './utils/lockTouchZoom'

// Lock mobile and tablet touch zoom without affecting desktop
initTouchZoomLock()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
