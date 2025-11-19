import './assets/midnight-syntax.css'
import './assets/toggle-theme.css'
import './assets/theme.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
