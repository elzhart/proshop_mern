import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import BackLink from '../components/admin/BackLink'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import FormField from '../components/admin/FormField'
import TextInput from '../components/admin/TextInput'
import Checkbox from '../components/admin/Checkbox'
import Banner from '../components/admin/Banner'
import ErrorState from '../components/admin/ErrorState'
import { getUserDetails, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'
import '../styles/admin.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const UserEditScreen = ({ match, history }) => {
  const userId = match.params.id
  const dispatch = useDispatch()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [emailError, setEmailError] = useState(null)
  const [banner, setBanner] = useState(null)

  const userDetails = useSelector((s) => s.userDetails)
  const { loading, error, user } = userDetails

  const userUpdate = useSelector((s) => s.userUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = userUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: USER_UPDATE_RESET })
      history.push('/admin/userlist')
    } else {
      if (!user.name || user._id !== userId) {
        dispatch(getUserDetails(userId))
      } else {
        setName(user.name)
        setEmail(user.email)
        setIsAdmin(user.isAdmin)
      }
    }
  }, [dispatch, history, userId, user, successUpdate])

  useEffect(() => {
    if (errorUpdate) setBanner({ variant: 'error', message: errorUpdate })
  }, [errorUpdate])

  const validateEmail = (value) => {
    if (!value) return 'Email is required'
    if (!EMAIL_RE.test(value)) return 'Must be a valid email address'
    return null
  }

  const submitHandler = (e) => {
    e.preventDefault()
    const err = validateEmail(email)
    setEmailError(err)
    if (err) return
    if (!name.trim()) return
    dispatch(updateUser({ _id: userId, name: name.trim(), email: email.trim(), isAdmin }))
  }

  const createdAt = user && user.createdAt
    ? `created ${String(user.createdAt).substring(0, 10)}`
    : null
  const subtitle = user && user.email && user._id === userId
    ? [user.email, createdAt].filter(Boolean).join(' · ')
    : null

  return (
    <div className='admin-root'>
      <BackLink to='/admin/userlist' />
      <AdminPageHeader title='Edit User' subtitle={subtitle} />

      {banner && (
        <Banner
          variant={banner.variant}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {error ? (
        <ErrorState
          message='We could not load this user. Retry before editing.'
          onRetry={() => dispatch(getUserDetails(userId))}
        />
      ) : (
        <div className='admin-form-card'>
          {loading ? (
            <div>
              <div className='admin-skeleton admin-skeleton-input' style={{ marginBottom: 24 }} />
              <div className='admin-skeleton admin-skeleton-input' style={{ marginBottom: 24 }} />
              <div className='admin-skeleton' style={{ width: 140, height: 18, marginBottom: 24 }} />
              <div className='admin-skeleton' style={{ width: 100, height: 34, borderRadius: 6 }} />
            </div>
          ) : (
            <form onSubmit={submitHandler} noValidate>
              <FormField id='name' label='Name' required>
                <TextInput value={name} onChange={setName} placeholder='Enter name' />
              </FormField>

              <FormField
                id='email'
                label='Email Address'
                required
                helper="We'll never share this."
                error={emailError}
              >
                <TextInput
                  type='email'
                  value={email}
                  onChange={(v) => { setEmail(v); if (emailError) setEmailError(null) }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  placeholder='you@example.com'
                />
              </FormField>

              <FormField id='isadmin' helper='Grants access to /admin/*'>
                <Checkbox checked={isAdmin} onChange={setIsAdmin} label='Is Admin' />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type='submit'
                  className='admin-btn admin-btn--primary'
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? 'Updating…' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default UserEditScreen
