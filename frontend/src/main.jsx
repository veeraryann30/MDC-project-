import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/console-dark.css'
import App from './App.jsx'
import { AuthProvider } from './lib/AuthContext'
import { initSmoothScroll } from './lib/smoothScroll'
import { initClickSounds } from './lib/sound'

initSmoothScroll()
initClickSounds()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
