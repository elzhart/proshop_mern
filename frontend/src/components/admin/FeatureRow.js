import React, { useEffect, useState } from 'react'
import StatusBadge from './StatusBadge'
import ToggleSwitch from './ToggleSwitch'
import TrafficSlider from './TrafficSlider'
import ResetButton from './ResetButton'
import WiredMarker from './WiredMarker'
import DescriptionPopover from './DescriptionPopover'
import { isFeatureActive } from '../../context/FeaturesContext'

const FeatureRow = ({
  id,
  effective,        // feature with overrides applied
  upstreamTraffic,  // value from features.json (not overridden)
  bucket,
  description,      // from features-descriptions.json or undefined
  wired,            // boolean
  isOverridden,
  onSetTraffic,     // (id, newValue, upstreamTraffic) => void
  onReset,          // (id) => void
}) => {
  // Local "pending" value during slider drag; commits to parent on release.
  const [pending, setPending] = useState(effective.traffic_percentage)

  // Sync pending when external value changes (e.g. SSE update or reset)
  useEffect(() => {
    setPending(effective.traffic_percentage)
  }, [effective.traffic_percentage])

  const status = effective.status
  const featureForMe = isFeatureActive(effective, bucket)

  const handleToggle = (next) => {
    onSetTraffic(id, next ? 100 : 0, upstreamTraffic)
  }

  const handleCommit = (value) => {
    onSetTraffic(id, value, upstreamTraffic)
  }

  return (
    <tr className={`admin-row ${status === 'Disabled' ? 'admin-row--disabled' : ''}`}>
      <td className='admin-row__id'>
        <code>{id}</code>
        {wired && <WiredMarker featureId={id} />}
      </td>
      <td className='admin-row__name'>
        <span>{effective.name}</span>
        {description && <DescriptionPopover feature={{ id, ...effective }} info={description} />}
      </td>
      <td className='admin-row__status'>
        <StatusBadge status={status} trafficPercentage={pending} />
      </td>
      <td className='admin-row__traffic'>
        <TrafficSlider
          value={pending}
          onChange={setPending}
          onCommit={handleCommit}
          ariaLabel={`Traffic percentage for ${effective.name}`}
        />
      </td>
      <td className='admin-row__forme'>
        <ToggleSwitch
          on={featureForMe}
          onChange={handleToggle}
          ariaLabel={`Toggle feature ${effective.name}`}
        />
      </td>
      <td className='admin-row__reset'>
        {isOverridden && (
          <ResetButton
            onClick={() => onReset(id)}
            ariaLabel={`Reset ${effective.name} to features.json default`}
          />
        )}
      </td>
    </tr>
  )
}

export default FeatureRow
