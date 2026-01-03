import React from 'react'
import { useToast } from '../../hook/useToast'
import SettingsForm from '../settings/SettingsForm'
import ToastNotification from '../../utils/ToastNotification'

const UserSettings = () => {
  const { toast } = useToast()

  return (
    <div
      className="flex flex-col h-full text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden relative"
      style={{ backgroundColor: 'rgb(var(--color-bg-primary-rgb))' }}
    >
      <ToastNotification toast={toast} />

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex relative">
        <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 overflow-y-auto h-full custom-scrollbar flex-1">
          <SettingsForm key="visual-settings" />
        </div>
      </div>
    </div>
  )
}

export default UserSettings
