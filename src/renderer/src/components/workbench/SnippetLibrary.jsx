import React from 'react'
import { useSnippetData } from '../../hook/useSnippetData'
import { ViewProvider } from '../../context/ViewContext'
import { ModalProvider } from './manager/ModalManager'
import SnippetLibraryInner from './SnippetLibraryInner'

const SnippetLibrary = () => {
  const snippetData = useSnippetData() // Global data fetcher

  return (
    <ViewProvider>
      <ModalProvider
        snippets={snippetData.snippets}
        folders={snippetData.folders}
        trash={snippetData.trash}
        onRestoreItem={snippetData.restoreItem}
        onPermanentDeleteItem={snippetData.permanentDeleteItem}
        onLoadTrash={snippetData.loadTrash}
        onSelectSnippet={(s) => {
          window.dispatchEvent(
            new CustomEvent('app:open-snippet', {
              detail: { title: s.title }
            })
          )
        }}
      >
        <SnippetLibraryInner snippetData={snippetData} />
      </ModalProvider>
    </ViewProvider>
  )
}

export default SnippetLibrary
