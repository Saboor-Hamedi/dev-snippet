import SnippetLibrary from './components/SnippetLibrary'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6'
    },
    background: {
      default: '#0f1117',
      paper: '#1a1d29'
    }
  }
})

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      {/* <SearchComponent />, */}
      <SnippetLibrary />
    </>
  )
}

export default App
