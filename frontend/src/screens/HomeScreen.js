import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col } from 'react-bootstrap'
import Product from '../components/Product'
import Message from '../components/Message'
import Loader from '../components/Loader'
import Paginate from '../components/Paginate'
import ProductCarousel from '../components/ProductCarousel'
import Meta from '../components/Meta'
import { listProducts } from '../actions/productActions'

const HomeScreen = ({ match }) => {
  const keyword = match.params.keyword

  const pageNumber = match.params.pageNumber || 1

  const dispatch = useDispatch()

  const productList = useSelector((state) => state.productList)
  const { loading, error, products, page, pages } = productList

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber))
  }, [dispatch, keyword, pageNumber])

  return (
    <div className='consumer-page consumer-home'>
      <Meta />
      {!keyword ? (
        <>
          <section className='consumer-hero'>
            <div className='consumer-hero-copy'>
              <span className='consumer-chip'>Limited drop</span>
              <h1>Tech that feels fast before you even power it on.</h1>
              <p>
                Discover curated audio, desk, and mobile gear with quick
                dispatch, secure checkout, and playful accessory bundles.
              </p>
              <div className='consumer-hero-actions'>
                <a href='#featured-products' className='consumer-btn consumer-btn-primary'>
                  Shop now
                </a>
                <Link to='/search/phone' className='consumer-btn consumer-btn-secondary'>
                  Browse deals
                </Link>
              </div>
              <div className='consumer-hero-meta'>
                <span>12k+ shoppers</span>
                <span>30-day swaps</span>
                <span>PayPal secure</span>
              </div>
            </div>
            <div className='consumer-hero-visual'>
              <ProductCarousel />
            </div>
          </section>

          <section className='consumer-category-section'>
            <div className='consumer-section-head'>
              <div>
                <span className='consumer-eyebrow'>Collections</span>
                <h2>Browse by category</h2>
              </div>
              <Link to='/search/camera'>See all collections</Link>
            </div>
            <div className='consumer-category-grid'>
              {['Audio', 'Cameras', 'Phones', 'Accessories'].map((category) => (
                <Link
                  key={category}
                  to={`/search/${category.toLowerCase()}`}
                  className='consumer-category-card'
                >
                  <i className='fas fa-bolt'></i>
                  <div>
                    <strong>{category}</strong>
                    <span>Curated picks</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className='consumer-breadcrumb'>
          <Link to='/'>Home</Link>
          <span>/</span>
          <strong>Search: {keyword}</strong>
        </div>
      )}

      <section id='featured-products' className='consumer-products-section'>
        <div className='consumer-section-head'>
          <div>
            <span className='consumer-eyebrow'>
              {keyword ? 'Search results' : 'Featured gear'}
            </span>
            <h2>{keyword ? `Results for "${keyword}"` : 'Latest products'}</h2>
          </div>
        </div>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Row className='consumer-product-grid'>
            {products.map((product) => (
              <Col key={product._id} sm={12} md={6} lg={4} xl={3} className='mb-4'>
                <Product product={product} />
              </Col>
            ))}
          </Row>
          <Paginate
            pages={pages}
            page={page}
            keyword={keyword ? keyword : ''}
          />
        </>
      )}
      </section>

      {!keyword && (
        <section className='consumer-showcase'>
          <div>
            <span>Why shoppers stay</span>
            <h2>Dense, trustworthy merchandising with a soft violet edge.</h2>
          </div>
          <div className='consumer-showcase-stats'>
            <strong>4.8/5 average rating</strong>
            <strong>Same-day dispatch</strong>
            <strong>2-year warranty</strong>
          </div>
        </section>
      )}
    </div>
  )
}

export default HomeScreen
