import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import UserRow from '../components/admin/UserRow'
import SkeletonRow from '../components/admin/SkeletonRow'
import EmptyState from '../components/admin/EmptyState'
import ErrorState from '../components/admin/ErrorState'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import Banner from '../components/admin/Banner'
import { listUsers, deleteUser } from '../actions/userActions'
import '../styles/admin.css'

const USER_SKELETON_WIDTHS = [
  { w: 180, h: 12 },
  { w: '60%', h: 14 },
  { w: 200, h: 14 },
  { w: 20, h: 20, r: '50%' },
  { w: 60, h: 14 },
]

const UserListScreen = ({ history }) => {
  const dispatch = useDispatch()
  const userList = useSelector((s) => s.userList)
  const { loading, error, users } = userList
  const userLogin = useSelector((s) => s.userLogin)
  const { userInfo } = userLogin
  const userDelete = useSelector((s) => s.userDelete)
  const { success: successDelete, error: errorDelete } = userDelete

  const [confirmTarget, setConfirmTarget] = useState(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, successDelete, userInfo])

  useEffect(() => {
    if (successDelete) {
      setBanner({ variant: 'success', message: 'User deleted' })
      setConfirmTarget(null)
    }
  }, [successDelete])

  useEffect(() => {
    if (errorDelete) {
      setBanner({ variant: 'error', message: errorDelete })
      setConfirmTarget(null)
    }
  }, [errorDelete])

  const handleConfirm = () => {
    if (confirmTarget) dispatch(deleteUser(confirmTarget._id))
  }

  const hasUsers = users && users.length > 0
  const isEmpty = !loading && !error && users && users.length === 0

  return (
    <div className='admin-root'>
      <AdminPageHeader title='Users' />

      {banner && (
        <Banner
          variant={banner.variant}
          message={banner.message}
          onClose={() => setBanner(null)}
          autoDismissMs={banner.variant === 'success' ? 5000 : null}
        />
      )}

      {error ? (
        <ErrorState
          message='Could not load users. Make sure the backend is running on port 5001.'
          onRetry={() => window.location.reload()}
        />
      ) : isEmpty ? (
        <EmptyState text='No users yet' cta={null} />
      ) : (
        <div className='admin-table-wrap'>
          <table className='admin-table' aria-label='Users' aria-busy={loading ? 'true' : 'false'}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Admin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} widths={USER_SKELETON_WIDTHS} />)
                : hasUsers && users.map((u) => (
                    <UserRow key={u._id} user={u} onDelete={setConfirmTarget} />
                  ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title='Delete user?'
        description={
          confirmTarget
            ? `This will permanently remove ${confirmTarget.name} (${confirmTarget.email}).`
            : ''
        }
        confirmLabel='Delete'
        confirmVariant='danger'
        cancelLabel='Cancel'
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}

export default UserListScreen
