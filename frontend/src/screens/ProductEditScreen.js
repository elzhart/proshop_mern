import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import BackLink from '../components/admin/BackLink'
import AdminPageHeader from '../components/admin/AdminPageHeader'
import FormField from '../components/admin/FormField'
import TextInput from '../components/admin/TextInput'
import NumberInput from '../components/admin/NumberInput'
import Textarea from '../components/admin/Textarea'
import FileUploadZone from '../components/admin/FileUploadZone'
import Banner from '../components/admin/Banner'
import ErrorState from '../components/admin/ErrorState'
import { listProductDetails, updateProduct } from '../actions/productActions'
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants'
import '../styles/admin.css'

const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id
  const dispatch = useDispatch()

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [countInStock, setCountInStock] = useState('')
  const [description, setDescription] = useState('')
  const [banner, setBanner] = useState(null)

  const productDetails = useSelector((s) => s.productDetails)
  const { loading, error, product } = productDetails

  const productUpdate = useSelector((s) => s.productUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET })
      history.push('/admin/productlist')
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId))
      } else {
        setName(product.name)
        setPrice(product.price)
        setImage(product.image)
        setBrand(product.brand)
        setCategory(product.category)
        setCountInStock(product.countInStock)
        setDescription(product.description)
      }
    }
  }, [dispatch, history, productId, product, successUpdate])

  useEffect(() => {
    if (errorUpdate) setBanner({ variant: 'error', message: errorUpdate })
  }, [errorUpdate])

  const submitHandler = (e) => {
    e.preventDefault()
    if (!name.trim() || !brand.trim() || !category.trim()) return
    dispatch(updateProduct({
      _id: productId,
      name: name.trim(),
      price: Number(price) || 0,
      image,
      brand: brand.trim(),
      category: category.trim(),
      description: description.trim(),
      countInStock: Number(countInStock) || 0,
    }))
  }

  const updatedAt = product && product.updatedAt
    ? `last updated ${String(product.updatedAt).substring(0, 10)}`
    : null
  const subtitle = product && product.name && product._id === productId
    ? [product.name, updatedAt].filter(Boolean).join(' · ')
    : null

  return (
    <div className='admin-root'>
      <BackLink to='/admin/productlist' />
      <AdminPageHeader title='Edit Product' subtitle={subtitle} />

      {banner && (
        <Banner
          variant={banner.variant}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      )}

      {error ? (
        <ErrorState
          message='We could not load this product. Retry before editing.'
          onRetry={() => dispatch(listProductDetails(productId))}
        />
      ) : (
        <div className='admin-form-card admin-form-card--wide'>
          {loading ? (
            <div>
              <div className='admin-skeleton admin-skeleton-input' style={{ marginBottom: 24 }} />
              <div className='admin-skeleton' style={{ width: '100%', height: 120, marginBottom: 24, borderRadius: 10 }} />
              <div className='admin-skeleton admin-skeleton-input' style={{ marginBottom: 24 }} />
              <div className='admin-skeleton' style={{ width: '100%', height: 96, marginBottom: 24, borderRadius: 6 }} />
              <div className='admin-skeleton' style={{ width: 100, height: 34, borderRadius: 6 }} />
            </div>
          ) : (
            <form onSubmit={submitHandler} noValidate>
              <FormField id='name' label='Name' required>
                <TextInput value={name} onChange={setName} placeholder='Enter name' />
              </FormField>

              <FormField id='image' label='Image' helper='Upload a file or paste a URL below.'>
                <FileUploadZone imageUrl={image} onChange={setImage} disabled={loadingUpdate} />
              </FormField>

              <FormField id='imageurl' label='or use image URL'>
                <TextInput
                  value={image}
                  onChange={setImage}
                  placeholder='https://…'
                />
              </FormField>

              <div className='admin-inline-group'>
                <FormField id='price' label='Price' required>
                  <NumberInput
                    value={price}
                    onChange={setPrice}
                    prefix='$'
                    min={0}
                    step={0.01}
                  />
                </FormField>
                <FormField id='stock' label='Count In Stock'>
                  <NumberInput
                    value={countInStock}
                    onChange={setCountInStock}
                    suffix='pcs'
                    min={0}
                    step={1}
                  />
                </FormField>
              </div>

              <div className='admin-inline-group'>
                <FormField id='brand' label='Brand' required>
                  <TextInput value={brand} onChange={setBrand} placeholder='Enter brand' />
                </FormField>
                <FormField id='category' label='Category' required>
                  <TextInput value={category} onChange={setCategory} placeholder='Enter category' />
                </FormField>
              </div>

              <FormField id='description' label='Description'>
                <Textarea
                  value={description}
                  onChange={setDescription}
                  maxLength={500}
                  placeholder='Tell people about this product'
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type='submit'
                  className='admin-btn admin-btn--primary'
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? 'Updating…' : 'Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductEditScreen
