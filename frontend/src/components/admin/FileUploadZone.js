import React, { useRef, useState } from 'react'
import axios from 'axios'

const UploadIcon = () => (
  <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor'
       strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
    <polyline points='17 8 12 3 7 8' />
    <line x1='12' y1='3' x2='12' y2='15' />
  </svg>
)

const FileUploadZone = ({ imageUrl, onChange, disabled }) => {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('image', file)
    try {
      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data)
    } catch (err) {
      setUploadError(
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : 'Upload failed'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (e) => upload(e.target.files[0])
  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) upload(e.dataTransfer.files[0])
  }

  if (imageUrl) {
    return (
      <div className='admin-upload-preview'>
        <div className='admin-upload-preview__thumb'>
          <img src={imageUrl} alt='Product preview' />
        </div>
        <div className='admin-upload-preview__meta'>
          <div className='admin-upload-preview__name'>{imageUrl.split('/').pop()}</div>
          <button
            type='button'
            className='admin-upload-preview__remove'
            onClick={() => onChange('')}
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className={`admin-dropzone ${dragOver ? 'admin-dropzone--over' : ''}`}
        onClick={() => !disabled && inputRef.current && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role='button'
        aria-label='Upload product image'
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current && inputRef.current.click()
          }
        }}
      >
        <UploadIcon />
        <div className='admin-dropzone__text'>
          {uploading ? 'Uploading…' : 'Drop image or click to browse'}
        </div>
        <div className='admin-dropzone__sub'>PNG, JPG up to 2MB</div>
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          style={{ display: 'none' }}
          onChange={handleFileInput}
          disabled={disabled}
        />
      </div>
      {uploadError && (
        <div className='admin-field__msg admin-field__msg--error' style={{ marginTop: 6 }}>
          {uploadError}
        </div>
      )}
    </div>
  )
}

export default FileUploadZone
