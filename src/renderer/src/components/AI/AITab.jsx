import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Brain, Cpu, Sparkles, Key } from 'lucide-react'
import { SettingSection, SettingRow, SettingSelect, SettingInput } from '../settings/components'

/**
 * AITab Component
 *
 * DeepSeek AI Integration settings.
 * Moved to AI folder for better encapsulation.
 */
const AITab = ({ settings, updateSetting }) => {
  const [localTemp, setLocalTemp] = useState(settings.ai?.temperature ?? 0.7)
  const [localApiKey, setLocalApiKey] = useState(settings.ai?.apiKey || '')

  // Sync local state reaching settings
  useEffect(() => {
    setLocalTemp(settings.ai?.temperature ?? 0.7)
    setLocalApiKey(settings.ai?.apiKey || '')
  }, [settings.ai?.temperature, settings.ai?.apiKey])

  const handleTempChange = (e) => {
    const val = parseFloat(e.target.value)
    setLocalTemp(val)
    updateSetting('ai.temperature', val)
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <SettingSection title="DeepSeek Configuration" icon={Brain}>
        <SettingRow
          label="API Key"
          description="Your DeepSeek API key. This is stored locally and never sent to our servers."
        >
          <div className="relative w-full max-w-md">
            <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
            <input
              type="password"
              placeholder="sk-..."
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              onBlur={() => updateSetting('ai.apiKey', localApiKey)}
              className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg py-2 pl-10 pr-4 text-xs outline-none focus:border-[var(--color-accent-primary)] transition-all font-mono"
            />
          </div>
        </SettingRow>

        <SettingSelect
          label="Default Model"
          description="Select which DeepSeek model to use for the AI Pilot."
          value={settings.ai?.model || 'deepseek-chat'}
          onChange={(v) => updateSetting('ai.model', v)}
          options={[
            { label: 'DeepSeek Chat (Efficient)', value: 'deepseek-chat' },
            { label: 'DeepSeek Reasoner (R1 - Deep Thinking)', value: 'deepseek-reasoner' }
          ]}
        />
      </SettingSection>

      <SettingSection title="Pilot Parameters" icon={Cpu}>
        <SettingSelect
          label="Thinking Temperature"
          description="Controls randomness: 0 is precise, 1 is creative."
          value={localTemp}
          onChange={(v) => {
            const val = parseFloat(v)
            setLocalTemp(val)
            updateSetting('ai.temperature', val)
          }}
          options={[
            { label: '0.0 - Precise & Analytical', value: 0 },
            { label: '0.3 - Balanced Logic', value: 0.3 },
            { label: '0.5 - Standard Assistant', value: 0.5 },
            { label: '0.7 - Creative & Natural (Default)', value: 0.7 },
            { label: '0.9 - Highly Innovative', value: 0.9 },
            { label: '1.0 - Unfiltered Exploration', value: 1 }
          ]}
        />

        <SettingSelect
          label="AI Pilot Scale"
          description="Default size of the floating AI Pilot modal."
          value={settings.ai?.pilotScale || 75}
          onChange={(v) => updateSetting('ai.pilotScale', parseInt(v))}
          options={[
            { label: 'Compact (50%)', value: 50 },
            { label: 'Balanced (75%)', value: 75 },
            { label: 'Immersive (100%)', value: 100 }
          ]}
        />
      </SettingSection>

      <div className="p-4 rounded-xl bg-[var(--color-accent-primary)]/5 border border-[var(--color-accent-primary)]/10 flex items-start gap-4">
        <Sparkles size={20} className="text-[var(--color-accent-primary)] mt-1 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-primary)]">
            AI Pilot Ready
          </h4>
          <p className="text-[11px] opacity-60 leading-relaxed">
            The AI Pilot uses the DeepSeek API to provide context-aware snippets, code refactoring,
            and intelligent research help directly inside your workstation.
          </p>
        </div>
      </div>
    </div>
  )
}

AITab.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSetting: PropTypes.func.isRequired
}

export default AITab
