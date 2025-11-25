import './assets/index.css'
// import './assets/css/syntax-highlighting.css'
import 'highlight.js/styles/github-dark.css'
import './assets/github.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
