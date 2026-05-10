import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import BooleanCell from './BooleanCell'
import ActionIconButton from './ActionIconButton'

const truncateMid = (s, head = 6, tail = 4) => {
  if (!s || s.length <= head + tail + 1) return s
  return `${s.slice(0, head)}…${s.slice(-tail)}`
}

const UserRow = ({ user, onDelete }) => (
  <tr className='admin-row'>
    <td className='admin-row__id'>
      <OverlayTrigger placement='top' overlay={<Tooltip id={`uid-${user._id}`}>{user._id}</Tooltip>}>
        <code>{truncateMid(user._id)}</code>
      </OverlayTrigger>
    </td>
    <td className='admin-row__name'>{user.name}</td>
    <td className='admin-row__email'>
      <a className='admin-link' href={`mailto:${user.email}`}>{user.email}</a>
    </td>
    <td className='admin-row__admin'>
      <BooleanCell value={user.isAdmin} trueLabel='Admin' falseLabel='Not admin' />
    </td>
    <td className='admin-row__actions'>
      <LinkContainer to={`/admin/user/${user._id}/edit`}>
        <span>
          <ActionIconButton
            variant='edit'
            ariaLabel={`Edit user ${user.name}`}
            tooltip='Edit user'
          />
        </span>
      </LinkContainer>
      <ActionIconButton
        variant='delete'
        ariaLabel={`Delete user ${user.name}`}
        tooltip='Delete user'
        onClick={() => onDelete(user)}
      />
    </td>
  </tr>
)

export default UserRow
