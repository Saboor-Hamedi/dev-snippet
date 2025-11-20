import './assets/css/variables.css'
import './assets/css/base.css'
import './assets/css/header.css'
import './assets/css/layout.css'
import './assets/css/snippets.css'
import './assets/css/forms.css'
import './assets/css/modals.css'
import './assets/css/syntax-highlighting.css'
import './assets/css/utilities.css'
import './assets/css/responsive.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
