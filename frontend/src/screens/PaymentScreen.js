import React, { useState } from 'react'
import { Form, Button, Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import CheckoutSteps from '../components/CheckoutSteps'
import { savePaymentMethod } from '../actions/cartActions'

const PaymentScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  if (!shippingAddress.address) {
    history.push('/shipping')
  }

  const [paymentMethod, setPaymentMethod] = useState('PayPal')

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(savePaymentMethod(paymentMethod))
    history.push('/placeorder')
  }

  return (
    <div className='consumer-page consumer-checkout-page'>
      <CheckoutSteps step1 step2 step3 />
      <Row className='consumer-two-col'>
        <Col lg={8}>
          <div className='consumer-checkout-intro'>
            <span className='consumer-eyebrow'>Checkout</span>
            <h1>Payment method</h1>
            <p>Choose how you want to complete this order.</p>
          </div>
          <Form onSubmit={submitHandler} className='consumer-payment-options'>
            <Form.Group>
              <Form.Label as='legend'>Select Method</Form.Label>
              <label className='consumer-radio-card' htmlFor='PayPal'>
                <Form.Check
                  type='radio'
                  label='PayPal or Credit Card'
                  id='PayPal'
                  name='paymentMethod'
                  value='PayPal'
                  checked={paymentMethod === 'PayPal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                ></Form.Check>
                <span>You'll be redirected securely after review.</span>
              </label>
            </Form.Group>

            <Button type='submit' className='consumer-primary-action'>
              Continue to Review
            </Button>
          </Form>
        </Col>
        <Col lg={4}>
          <div className='consumer-summary-card'>
            <h2>Payment Summary</h2>
            <div className='consumer-summary-line'>
              <span>Method</span>
              <strong>{paymentMethod}</strong>
            </div>
            <p className='consumer-trust-note'>
              <i className='fas fa-lock'></i> Payment details are handled by PayPal.
            </p>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default PaymentScreen
