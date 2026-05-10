import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import CheckoutSteps from '../components/CheckoutSteps'
import { createOrder } from '../actions/orderActions'
import { ORDER_CREATE_RESET } from '../constants/orderConstants'
import { USER_DETAILS_RESET } from '../constants/userConstants'

const PlaceOrderScreen = ({ history }) => {
  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)

  if (!cart.shippingAddress.address) {
    history.push('/shipping')
  } else if (!cart.paymentMethod) {
    history.push('/payment')
  }
  //   Calculate prices
  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(2)
  }

  cart.itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  )
  cart.shippingPrice = addDecimals(cart.itemsPrice > 100 ? 0 : 100)
  cart.taxPrice = addDecimals(Number((0.15 * cart.itemsPrice).toFixed(2)))
  cart.totalPrice = (
    Number(cart.itemsPrice) +
    Number(cart.shippingPrice) +
    Number(cart.taxPrice)
  ).toFixed(2)

  const orderCreate = useSelector((state) => state.orderCreate)
  const { order, success, error } = orderCreate

  useEffect(() => {
    if (success) {
      history.push(`/order/${order._id}`)
      dispatch({ type: USER_DETAILS_RESET })
      dispatch({ type: ORDER_CREATE_RESET })
    }
    // eslint-disable-next-line
  }, [history, success])

  const placeOrderHandler = () => {
    dispatch(
      createOrder({
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
      })
    )
  }

  return (
    <div className='consumer-page consumer-checkout-page'>
      <CheckoutSteps step1 step2 step3 step4 />
      <Row className='consumer-two-col'>
        <Col lg={8}>
          <div className='consumer-checkout-intro'>
            <span className='consumer-eyebrow'>Review</span>
            <h1>Place order</h1>
            <p>Confirm your shipping, payment, and items before checkout.</p>
          </div>
          <ListGroup variant='flush' className='consumer-review-stack'>
            <ListGroup.Item className='consumer-card'>
              <h2>Shipping</h2>
              <p>
                <strong>Address:</strong>
                {cart.shippingAddress.address}, {cart.shippingAddress.city}{' '}
                {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
            </ListGroup.Item>

            <ListGroup.Item className='consumer-card'>
              <h2>Payment Method</h2>
              <strong>Method: </strong>
              {cart.paymentMethod}
            </ListGroup.Item>

            <ListGroup.Item className='consumer-card'>
              <h2>Order Items</h2>
              {cart.cartItems.length === 0 ? (
                <Message>Your cart is empty</Message>
              ) : (
                <ListGroup variant='flush' className='consumer-cart-list compact'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item key={index} className='consumer-cart-row'>
                        <div className='consumer-cart-image'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                          />
                        </div>
                        <div className='consumer-cart-copy'>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </div>
                        <div className='consumer-cart-price'>
                          {item.qty} x ${item.price} = ${item.qty * item.price}
                        </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col lg={4}>
          <Card className='consumer-summary-card'>
            <Card.Body>
                <h2>Order Summary</h2>
                <div className='consumer-summary-line'>
                  <span>Items</span>
                  <strong>${cart.itemsPrice}</strong>
                </div>
                <div className='consumer-summary-line'>
                  <span>Shipping</span>
                  <strong>${cart.shippingPrice}</strong>
                </div>
                <div className='consumer-summary-line'>
                  <span>Tax</span>
                  <strong>${cart.taxPrice}</strong>
                </div>
                <div className='consumer-summary-line total'>
                  <span>Total</span>
                  <strong>${cart.totalPrice}</strong>
                </div>
                {error && <Message variant='danger'>{error}</Message>}
                <Button
                  type='button'
                  className='consumer-primary-action'
                  disabled={cart.cartItems === 0}
                  onClick={placeOrderHandler}
                >
                  Place Order
                </Button>
                <p className='consumer-trust-note'>
                  <i className='fas fa-lock'></i> Secure checkout · encrypted payment
                </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PlaceOrderScreen
