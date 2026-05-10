import React, { useState } from 'react'
import { Form, Button, Row, Col, Card } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import CheckoutSteps from '../components/CheckoutSteps'
import { saveShippingAddress } from '../actions/cartActions'

const ShippingScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  const [address, setAddress] = useState(shippingAddress.address)
  const [city, setCity] = useState(shippingAddress.city)
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode)
  const [country, setCountry] = useState(shippingAddress.country)

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(saveShippingAddress({ address, city, postalCode, country }))
    history.push('/payment')
  }

  return (
    <div className='consumer-page consumer-checkout-page'>
      <CheckoutSteps step1 step2 />
      <Row className='consumer-two-col'>
        <Col lg={8}>
          <div className='consumer-checkout-intro'>
            <span className='consumer-eyebrow'>Checkout</span>
            <h1>Shipping address</h1>
            <p>Use the address where you want your gear delivered.</p>
          </div>
          <Card className='consumer-form-card'>
            <Card.Body>
              <Form onSubmit={submitHandler}>
        <Form.Group controlId='address'>
          <Form.Label>Address</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter address'
            value={address}
            required
            className='consumer-input'
            onChange={(e) => setAddress(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='city'>
          <Form.Label>City</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter city'
            value={city}
            required
            className='consumer-input'
            onChange={(e) => setCity(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='postalCode'>
          <Form.Label>Postal Code</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter postal code'
            value={postalCode}
            required
            className='consumer-input'
            onChange={(e) => setPostalCode(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Form.Group controlId='country'>
          <Form.Label>Country</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter country'
            value={country}
            required
            className='consumer-input'
            onChange={(e) => setCountry(e.target.value)}
          ></Form.Control>
        </Form.Group>

        <Button type='submit' className='consumer-primary-action'>
          Continue to Payment
        </Button>
      </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <div className='consumer-summary-card'>
            <h2>Order Summary</h2>
            <div className='consumer-summary-line'>
              <span>Shipping</span>
              <strong>Calculated by address</strong>
            </div>
            <p className='consumer-trust-note'>
              <i className='fas fa-shield-alt'></i> Secure checkout · encrypted payment
            </p>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default ShippingScreen
