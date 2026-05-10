import React from 'react'

const DEFAULT_FF_WIDTHS = [
  { w: 120, h: 14 },
  { w: '70%', h: 14 },
  { w: 74, h: 18, r: 9999 },
  { w: '90%', h: 14 },
  { w: 32, h: 18, r: 9999 },
  { w: 14, h: 14, r: '50%' },
]

const SkeletonRow = ({ widths }) => {
  const cells = widths || DEFAULT_FF_WIDTHS
  return (
    <tr aria-hidden='true' className='admin-skeleton-row'>
      {cells.map((cell, i) => (
        <td key={i}>
          <div
            className='admin-skeleton'
            style={{
              width: cell.w,
              height: cell.h || 14,
              borderRadius: cell.r != null ? cell.r : undefined,
            }}
          />
        </td>
      ))}
    </tr>
  )
}

export default SkeletonRow
