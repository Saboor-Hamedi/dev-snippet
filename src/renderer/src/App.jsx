import SnippetLibrary from './components/SnippetLibrary'

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
