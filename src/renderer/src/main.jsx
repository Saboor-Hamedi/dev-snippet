import './assets/index.css'
import './assets/toast.css'
import './assets/markdown.css'
import './components/CodeEditor/CodeEditor.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
