import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/console-dark.css'
import App from './App.jsx'
import { initSmoothScroll } from './lib/smoothScroll'

initSmoothScroll()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
