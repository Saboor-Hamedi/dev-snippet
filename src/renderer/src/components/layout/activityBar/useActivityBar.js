import { useMemo } from 'react'

/**
 * Hook to manage Activity Bar items and styles
 * @param {object} settings - The application settings (from useSettingsContext)
 * @param {string} activeTab - Currently active tab
 * @param {number} trashCount - Number of items in trash
 */
export const useActivityBar = (settings, activeTab, trashCount) => {
  const styles = useMemo(() => {
    return {
      container: {
        backgroundColor: 'var(--activity-bar-bg, #161b22)',
        borderRight: '1px solid var(--color-border, #444)'
      },
      item: (isActive) => ({
        color: isActive
          ? 'var(--activity-bar-active-fg, var(--color-accent-primary, #ffffff))'
          : 'var(--activity-bar-inactive-fg, var(--color-text-secondary, rgba(255, 255, 255, 0.4)))',
        opacity: isActive ? 1 : 0.6
      }),
      indicator: {
        backgroundColor: 'var(--activity-bar-active-border, var(--color-accent-primary, #007fd4))'
      },
      badge: {
        backgroundColor: 'var(--activity-bar-badge-bg, #ef4444)',
        color: 'var(--activity-bar-badge-fg, #ffffff)'
      }
    }
  }, [settings, activeTab])

  return { styles }
}
