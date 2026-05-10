import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Image, ListGroup, Button, Form } from 'react-bootstrap'
import Rating from '../components/Rating'
import Message from '../components/Message'
import Loader from '../components/Loader'
import Meta from '../components/Meta'
import {
  listProductDetails,
  createProductReview,
  listTopProducts,
} from '../actions/productActions'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'
import useFeature from '../hooks/useFeature'
import Product from '../components/Product'

const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const dispatch = useDispatch()

  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const productReviewCreate = useSelector((state) => state.productReviewCreate)
  const {
    success: successProductReview,
    loading: loadingProductReview,
    error: errorProductReview,
  } = productReviewCreate

  const { active: recsOn } = useFeature('product_recommendations')
  const productTopRated = useSelector((state) => state.productTopRated)
  const { products: topProducts = [] } = productTopRated

  useEffect(() => {
    if (successProductReview) {
      setRating(0)
      setComment('')
    }
    if (!product._id || product._id !== match.params.id) {
      dispatch(listProductDetails(match.params.id))
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
    }
  }, [dispatch, match, successProductReview])

  useEffect(() => {
    if (recsOn) dispatch(listTopProducts())
  }, [dispatch, recsOn])

  const addToCartHandler = () => {
    history.push(`/cart/${match.params.id}?qty=${qty}`)
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(
      createProductReview(match.params.id, {
        rating,
        comment,
      })
    )
  }

  return (
    <div className='consumer-page consumer-product-page'>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Meta title={product.name} />
          <div className='consumer-breadcrumb'>
            <Link to='/'>Home</Link>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <strong>{product.name}</strong>
          </div>

          <section className='consumer-product-detail'>
            <div className='consumer-gallery'>
              <div className='consumer-gallery-main'>
                <Image src={product.image} alt={product.name} fluid />
                <span className='consumer-product-badge'>Featured</span>
              </div>
              <div className='consumer-gallery-thumbs'>
                {[1, 2, 3].map((thumb) => (
                  <div className='consumer-thumb is-active' key={thumb}>
                    <Image src={product.image} alt={`${product.name} view ${thumb}`} fluid />
                  </div>
                ))}
              </div>
            </div>

            <div className='consumer-product-info'>
              <span className='consumer-chip'>{product.brand || 'ProShop'} · {product.category}</span>
              <h1>{product.name}</h1>
              <Rating
                value={product.rating}
                text={`${product.numReviews} reviews`}
              />
              <div className='consumer-price'>${product.price}</div>
              <p>{product.description}</p>

              <div
                className={`consumer-stock ${product.countInStock > 0 ? 'is-in' : 'is-out'}`}
              >
                <span></span>
                {product.countInStock > 0
                  ? `In stock · ${product.countInStock} available`
                  : 'Out of stock — notify me'}
              </div>

              {product.countInStock > 0 && (
                <Form.Group controlId='qty' className='consumer-qty-group'>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    as='select'
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className='consumer-input'
                  >
                    {[...Array(product.countInStock).keys()].map((x) => (
                      <option key={x + 1} value={x + 1}>
                        {x + 1}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              )}

              <Button
                onClick={addToCartHandler}
                className='consumer-primary-action'
                type='button'
                disabled={product.countInStock === 0}
              >
                Add To Cart · ${(Number(product.price) * Number(qty)).toFixed(2)}
              </Button>

              <div className='consumer-info-grid'>
                <div>
                  <span>SKU</span>
                  <strong>{product._id && product._id.substring(0, 8).toUpperCase()}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>Free · 1-2 days</strong>
                </div>
              </div>
            </div>
          </section>

          <section className='consumer-card consumer-reviews'>
            <div className='consumer-tabs'>
              <button className='is-active'>Reviews ({product.numReviews})</button>
              <button>Details</button>
              <button>Shipping</button>
            </div>
            <Row>
              <Col lg={7}>
              <h2>Reviews</h2>
              {product.reviews.length === 0 && <Message>No Reviews</Message>}
              <ListGroup variant='flush'>
                {product.reviews.map((review) => (
                  <ListGroup.Item key={review._id} className='consumer-review-item'>
                    <strong>{review.name}</strong>
                    <Rating value={review.rating} />
                    <p>{review.createdAt.substring(0, 10)}</p>
                    <p>{review.comment}</p>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item>
                  <h2>Write a Customer Review</h2>
                  {successProductReview && (
                    <Message variant='success'>
                      Review submitted successfully
                    </Message>
                  )}
                  {loadingProductReview && <Loader />}
                  {errorProductReview && (
                    <Message variant='danger'>{errorProductReview}</Message>
                  )}
                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group controlId='rating'>
                        <Form.Label>Rating</Form.Label>
                        <Form.Control
                          as='select'
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                        >
                          <option value=''>Select...</option>
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group controlId='comment'>
                        <Form.Label>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                          row='3'
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></Form.Control>
                      </Form.Group>
                      <Button
                        disabled={loadingProductReview}
                        type='submit'
                        variant='primary'
                      >
                        Submit
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to='/login'>sign in</Link> to write a review{' '}
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
              </Col>
              <Col lg={5}>
                <div className='consumer-card consumer-spec-card'>
                  <h2>Why it fits</h2>
                  <p>{product.description}</p>
                  <div className='consumer-info-grid'>
                    <div>
                      <span>Category</span>
                      <strong>{product.category}</strong>
                    </div>
                    <div>
                      <span>Brand</span>
                      <strong>{product.brand || 'ProShop'}</strong>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </section>

          {recsOn && topProducts.length > 0 && (
            <section className='consumer-products-section'>
              <div className='consumer-section-head'>
                <div>
                  <span className='consumer-eyebrow'>Recommended</span>
                  <h2>Customers also bought</h2>
                </div>
              </div>
                <Row className='consumer-product-grid'>
                  {topProducts
                    .filter((p) => p._id !== product._id)
                    .slice(0, 4)
                    .map((p) => (
                      <Col key={p._id} sm={12} md={6} lg={3} className='mb-4'>
                        <Product product={p} />
                      </Col>
                    ))}
                </Row>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default ProductScreen
