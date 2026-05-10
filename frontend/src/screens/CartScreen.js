import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap'
import { addToCart, removeFromCart } from '../actions/cartActions'

const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id

  const qty = location.search ? Number(location.search.split('=')[1]) : 1

  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)
  const { cartItems } = cart

  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty))
    }
  }, [dispatch, productId, qty])

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id))
  }

  const checkoutHandler = () => {
    history.push('/login?redirect=shipping')
  }

  return (
    <div className='consumer-page consumer-shell-page'>
      <div className='consumer-page-strip'></div>
      <div className='consumer-breadcrumb'>
        <Link to='/'>Home</Link>
        <span>/</span>
        <strong>Cart</strong>
      </div>
      <div className='consumer-page-head'>
        <div>
          <span className='consumer-eyebrow'>Checkout starts here</span>
          <h1>Your Cart</h1>
        </div>
        <span className='consumer-pill'>
          {cartItems.reduce((acc, item) => acc + item.qty, 0)} items
        </span>
      </div>
      <Row className='consumer-two-col'>
      <Col lg={8}>
        {cartItems.length === 0 ? (
          <div className='consumer-empty-state'>
            <i className='fas fa-shopping-cart'></i>
            <h2>Your cart is empty</h2>
            <p>Start with the latest products and build your setup.</p>
            <Link to='/' className='consumer-btn consumer-btn-primary'>
              Continue shopping
            </Link>
          </div>
        ) : (
          <ListGroup variant='flush' className='consumer-cart-list'>
            {cartItems.map((item) => (
              <ListGroup.Item key={item.product} className='consumer-cart-row'>
                  <div className='consumer-cart-image'>
                    <Image src={item.image} alt={item.name} fluid />
                  </div>
                  <div className='consumer-cart-copy'>
                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                    <span>Ready to ship</span>
                  </div>
                  <div className='consumer-cart-price'>${item.price}</div>
                  <div>
                    <Form.Control
                      as='select'
                      value={item.qty}
                      className='consumer-input'
                      onChange={(e) =>
                        dispatch(
                          addToCart(item.product, Number(e.target.value))
                        )
                      }
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </Form.Control>
                  </div>
                  <div>
                    <Button
                      type='button'
                      className='consumer-icon-button'
                      onClick={() => removeFromCartHandler(item.product)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>
      <Col lg={4}>
        <Card className='consumer-summary-card'>
          <Card.Body>
              <h2>Order Summary</h2>
              <div className='consumer-summary-line'>
                <span>Items ({cartItems.reduce((acc, item) => acc + item.qty, 0)})</span>
                <strong>
                  ${cartItems
                    .reduce((acc, item) => acc + item.qty * item.price, 0)
                    .toFixed(2)}
                </strong>
              </div>
              <div className='consumer-summary-line'>
                <span>Shipping</span>
                <strong>Calculated next</strong>
              </div>
              <Button
                type='button'
                className='consumer-primary-action'
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
              >
                Proceed To Checkout
              </Button>
              <p className='consumer-trust-note'>
                <i className='fas fa-shield-alt'></i> Secure checkout · 30-day returns
              </p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
    </div>
  )
}

export default CartScreen
