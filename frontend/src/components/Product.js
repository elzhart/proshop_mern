import React from 'react'
import { Link } from 'react-router-dom'
import Rating from './Rating'
import useFeature from '../hooks/useFeature'

const Product = ({ product }) => {
  const { active: lazyOn } = useFeature('image_lazy_loading')
  const isOut = product.countInStock === 0

  return (
    <article className={`consumer-product-card${isOut ? ' is-out' : ''}`}>
      <Link to={`/product/${product._id}`} className='consumer-product-image-wrap'>
        <img
          src={product.image}
          alt={product.name}
          loading={lazyOn ? 'lazy' : 'eager'}
          className='consumer-product-image'
        />
        <span className='consumer-product-badge'>
          {isOut ? 'Out of stock' : 'Featured'}
        </span>
      </Link>

      <div className='consumer-product-body'>
        <div className='consumer-eyebrow'>{product.brand || 'ProShop'} · {product.category}</div>
        <Link to={`/product/${product._id}`} className='consumer-product-title'>
          {product.name}
        </Link>
        <div className='consumer-product-rating'>
          <Rating
            value={product.rating}
            text={`${product.numReviews} reviews`}
          />
        </div>
        <div className='consumer-product-price-row'>
          <span className='consumer-price-sm'>${product.price}</span>
          <Link
            to={`/product/${product._id}`}
            className='consumer-icon-cta'
            aria-label={`View ${product.name}`}
          >
            <i className='fas fa-plus'></i>
          </Link>
        </div>
      </div>
    </article>
  )
}

export default Product
