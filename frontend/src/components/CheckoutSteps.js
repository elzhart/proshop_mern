import React from 'react'
import { LinkContainer } from 'react-router-bootstrap'

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  const steps = [
    { label: 'Cart', path: '/cart', active: true, complete: step1 },
    { label: 'Shipping', path: '/shipping', active: step2, complete: step3 || step4 },
    { label: 'Payment', path: '/payment', active: step3, complete: step4 },
    { label: 'Review', path: '/placeorder', active: step4, complete: false },
    { label: 'Order', path: '#', active: false, complete: false },
  ]

  return (
    <nav className='consumer-checkout-steps' aria-label='Checkout progress'>
      {steps.map((item, index) => {
        const isCurrent =
          (item.label === 'Cart' && !step2) ||
          (item.label === 'Shipping' && step2 && !step3) ||
          (item.label === 'Payment' && step3 && !step4) ||
          (item.label === 'Review' && step4)
        const className = [
          'consumer-step',
          item.complete ? 'is-complete' : '',
          isCurrent ? 'is-current' : '',
        ].join(' ')

        return (
          <React.Fragment key={item.label}>
            <div className={className}>
              {item.active && item.path !== '#' ? (
                <LinkContainer to={item.path}>
                  <a href={item.path}>
                    <span className='consumer-step-circle'>
                      {item.complete ? <i className='fas fa-check'></i> : index + 1}
                    </span>
                    <span>{item.label}</span>
                  </a>
                </LinkContainer>
              ) : (
                <span>
                  <span className='consumer-step-circle'>{index + 1}</span>
                  <span>{item.label}</span>
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <span className={`consumer-step-line${item.complete ? ' is-complete' : ''}`}></span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export default CheckoutSteps
