import React from 'react'
import { Modal } from 'react-bootstrap'

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => (
  <Modal
    show={open}
    onHide={onCancel}
    centered
    backdrop='static'
    keyboard
    aria-labelledby='admin-confirm-title'
    dialogClassName='admin-confirm-modal'
    contentClassName='admin-confirm-content'
  >
    <div className='admin-confirm-body'>
      <h3 id='admin-confirm-title' className='admin-confirm-title'>{title}</h3>
      {description && (
        <p className='admin-confirm-desc'>{description}</p>
      )}
      <div className='admin-confirm-actions'>
        <button
          type='button'
          className='admin-btn admin-btn--secondary'
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type='button'
          className={`admin-btn admin-btn--${confirmVariant}`}
          onClick={onConfirm}
          autoFocus
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
)

export default ConfirmDialog
