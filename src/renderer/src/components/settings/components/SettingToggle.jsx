import React from 'react'
import PropTypes from 'prop-types'
import { ToggleButton } from '../../ToggleButton'
import SettingRow from './SettingRow'

/**
 * Combined toggle setting with label and description
 * Wraps ToggleButton in a SettingRow for consistency
 */
const SettingToggle = ({ label, description, checked, onChange, noBorder = false }) => {
  return (
    <SettingRow label={label} description={description} noBorder={noBorder}>
      <ToggleButton checked={checked} onChange={onChange} />
    </SettingRow>
  )
}

SettingToggle.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  noBorder: PropTypes.bool
}

export default SettingToggle
