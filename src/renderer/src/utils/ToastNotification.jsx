import { useState } from 'react'

// Simple toast hook
export const useToast = () => {
  const [toast, setToast] = useState(null)
  
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }
  
  return [toast, showToast]
}

// Example Usage (copy this into your component):
/*
const [toast, showToast] = useToast()

const handleCopy = async () => {
  // Assuming copyToClipboard is a function you have
  await copyToClipboard(snippet.code)
  showToast('✓ Copied to clipboard!')
}
*/