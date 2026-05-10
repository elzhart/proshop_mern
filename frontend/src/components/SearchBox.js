import React, { useState } from 'react'
import { Form, Button } from 'react-bootstrap'

const SearchBox = ({ history, isAdminRoute }) => {
  const [keyword, setKeyword] = useState('')

  const submitHandler = (e) => {
    e.preventDefault()
    if (keyword.trim()) {
      history.push(`/search/${keyword}`)
    } else {
      history.push('/')
    }
  }

  if (isAdminRoute) {
    return (
      <Form onSubmit={submitHandler} inline>
        <Form.Control
          type='text'
          name='q'
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='Search Products...'
          className='mr-sm-2 ml-sm-5'
        ></Form.Control>
        <Button type='submit' variant='outline-success' className='p-2'>
          Search
        </Button>
      </Form>
    )
  }

  return (
    <Form onSubmit={submitHandler} inline className='consumer-search'>
      <i className='fas fa-search consumer-search-icon'></i>
      <Form.Control
        type='text'
        name='q'
        onChange={(e) => setKeyword(e.target.value)}
        placeholder='Search products, brands, categories...'
        className='consumer-search-input'
      ></Form.Control>
      <Button type='submit' className='consumer-search-button'>
        Search
      </Button>
    </Form>
  )
}

export default SearchBox
