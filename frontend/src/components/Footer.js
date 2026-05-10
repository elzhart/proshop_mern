import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

const Footer = ({ isAdminRoute }) => {
  if (isAdminRoute) {
    return (
      <footer>
        <Container>
          <Row>
            <Col className='text-center py-3'>Copyright &copy; ProShop</Col>
          </Row>
        </Container>
      </footer>
    )
  }

  return (
    <footer className='consumer-footer'>
      <Container className='consumer-container'>
        <Row>
          <Col md={4}>
            <div className='consumer-logo mb-3'>ProShop</div>
            <p>Curated tech gear with quick dispatch, secure checkout, and practical support.</p>
          </Col>
          <Col md={2}>
            <h4>Shop</h4>
            <a href='/'>New arrivals</a>
            <a href='/'>Top rated</a>
            <a href='/cart'>Cart</a>
          </Col>
          <Col md={3}>
            <h4>Support</h4>
            <a href='/profile'>Account</a>
            <a href='/shipping'>Shipping</a>
            <a href='mailto:support@proshop.dev'>Contact</a>
          </Col>
          <Col md={3}>
            <h4>Trust</h4>
            <p>Apple Pay · PayPal · 30-day returns · 2-year warranty</p>
          </Col>
        </Row>
        <Row className='consumer-footer-bottom'>
          <Col>© 2026 ProShop. All rights reserved.</Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
