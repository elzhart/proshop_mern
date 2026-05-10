import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PayPalButton } from 'react-paypal-button-v2'
import { Link } from 'react-router-dom'
import { Row, Col, ListGroup, Image, Card, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import {
  getOrderDetails,
  payOrder,
  deliverOrder,
} from '../actions/orderActions'
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from '../constants/orderConstants'
import useFeature from '../hooks/useFeature'

const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id

  const [sdkReady, setSdkReady] = useState(false)
  const { active: paypalOn } = useFeature('paypal_express_buttons')

  const dispatch = useDispatch()

  const orderDetails = useSelector((state) => state.orderDetails)
  const { order, loading, error } = orderDetails

  const orderPay = useSelector((state) => state.orderPay)
  const { loading: loadingPay, success: successPay } = orderPay

  const orderDeliver = useSelector((state) => state.orderDeliver)
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  if (!loading) {
    //   Calculate prices
    const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2)
    }

    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    )
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    }

    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get('/api/config/paypal')
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`
      script.async = true
      script.onload = () => {
        setSdkReady(true)
      }
      document.body.appendChild(script)
    }

    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET })
      dispatch({ type: ORDER_DELIVER_RESET })
      dispatch(getOrderDetails(orderId))
    } else if (!order.isPaid) {
      if (!window.paypal) {
        addPayPalScript()
      } else {
        setSdkReady(true)
      }
    }
  }, [dispatch, orderId, successPay, successDeliver, order])

  const successPaymentHandler = (paymentResult) => {
    console.log(paymentResult)
    dispatch(payOrder(orderId, paymentResult))
  }

  const deliverHandler = () => {
    dispatch(deliverOrder(order))
  }

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <div className='consumer-page consumer-shell-page'>
      <div className='consumer-page-strip'></div>
      <div className='consumer-page-head'>
        <div>
          <span className='consumer-eyebrow'>Order details</span>
          <h1>Order {order._id}</h1>
        </div>
        <span className={`consumer-pill ${order.isPaid ? 'is-success' : 'is-danger'}`}>
          {order.isPaid ? 'Paid' : 'Payment due'}
        </span>
      </div>
      <Row className='consumer-two-col'>
        <Col lg={8}>
          <ListGroup variant='flush' className='consumer-review-stack'>
            <ListGroup.Item className='consumer-card'>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong> {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>{' '}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address:</strong>
                {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant='success'>
                  Delivered on {order.deliveredAt}
                </Message>
              ) : (
                <Message variant='danger'>Not Delivered</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item className='consumer-card'>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <Message variant='success'>Paid on {order.paidAt}</Message>
              ) : (
                <Message variant='danger'>Not Paid</Message>
              )}
            </ListGroup.Item>

            <ListGroup.Item className='consumer-card'>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush' className='consumer-cart-list compact'>
                  {order.orderItems.map((item, index) => (
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
                  <strong>${order.itemsPrice}</strong>
                </div>
                <div className='consumer-summary-line'>
                  <span>Shipping</span>
                  <strong>${order.shippingPrice}</strong>
                </div>
                <div className='consumer-summary-line'>
                  <span>Tax</span>
                  <strong>${order.taxPrice}</strong>
                </div>
                <div className='consumer-summary-line total'>
                  <span>Total</span>
                  <strong>${order.totalPrice}</strong>
                </div>
              {!order.isPaid && (
                <div className='consumer-paypal-box'>
                  {loadingPay && <Loader />}
                  {!paypalOn ? (
                    <Message variant='warning'>
                      PayPal payments are temporarily unavailable. Please try again later.
                    </Message>
                  ) : !sdkReady ? (
                    <Loader />
                  ) : (
                    <PayPalButton
                      amount={order.totalPrice}
                      onSuccess={successPaymentHandler}
                    />
                  )}
                </div>
              )}
              {loadingDeliver && <Loader />}
              {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDelivered && (
                    <Button
                      type='button'
                      className='consumer-primary-action'
                      onClick={deliverHandler}
                    >
                      Mark As Delivered
                    </Button>
                )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default OrderScreen
