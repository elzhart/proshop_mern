/**
 * Characterization tests for the inline price-calculation logic.
 *
 * Source: frontend/src/screens/PlaceOrderScreen.js (identical copy exists
 * in OrderScreen.js for itemsPrice only).
 *
 * These tests lock CURRENT behaviour, including known bugs.
 * Do NOT change assertions to make them "more correct" — fix the source
 * first, then update the tests.
 */

// ---------------------------------------------------------------------------
// Verbatim extraction from PlaceOrderScreen.js — do not "improve" this copy
// ---------------------------------------------------------------------------
function calcPrices(cartItems) {
  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(2)
  }

  const result = {}

  result.itemsPrice = addDecimals(
    cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  )
  result.shippingPrice = addDecimals(result.itemsPrice > 100 ? 0 : 100)
  result.taxPrice = addDecimals(Number((0.15 * result.itemsPrice).toFixed(2)))
  result.totalPrice = (
    Number(result.itemsPrice) +
    Number(result.shippingPrice) +
    Number(result.taxPrice)
  ).toFixed(2)

  return result
}
// ---------------------------------------------------------------------------

describe('calcPrices', () => {

  // ── Happy path ────────────────────────────────────────────────────────────

  describe('happy path', () => {
    test('single item below free-shipping threshold', () => {
      const result = calcPrices([{ price: 29.99, qty: 2 }])
      expect(result.itemsPrice).toBe('59.98')
      expect(result.shippingPrice).toBe('100.00')
      expect(result.taxPrice).toBe('9.00')
      expect(result.totalPrice).toBe('168.98')
    })

    test('single item above free-shipping threshold', () => {
      const result = calcPrices([{ price: 60, qty: 2 }]) // 120.00
      expect(result.itemsPrice).toBe('120.00')
      expect(result.shippingPrice).toBe('0.00')
      expect(result.taxPrice).toBe('18.00')
      expect(result.totalPrice).toBe('138.00')
    })

    test('multiple items', () => {
      const result = calcPrices([
        { price: 10.99, qty: 3 },
        { price: 5.50,  qty: 2 },
      ])
      expect(result.itemsPrice).toBe('43.97')   // 32.97 + 11.00
      expect(result.shippingPrice).toBe('100.00')
      expect(result.taxPrice).toBe('6.60')       // 0.15 × 43.97 = 6.5955 → rounds up
      expect(result.totalPrice).toBe('150.57')
    })
  })

  // ── All return values are strings ─────────────────────────────────────────

  describe('return types', () => {
    test('every price field is a string, not a number', () => {
      // This asserts current buggy behavior.
      // Correct would be: return numbers — callers are forced to wrap in
      // Number() before arithmetic, which is easy to forget and causes
      // string-concatenation bugs ("59.98" + "100.00" = "59.98100.00").
      const result = calcPrices([{ price: 50, qty: 1 }])
      expect(typeof result.itemsPrice).toBe('string')
      expect(typeof result.shippingPrice).toBe('string')
      expect(typeof result.taxPrice).toBe('string')
      expect(typeof result.totalPrice).toBe('string')
    })
  })

  // ── Free-shipping boundary ────────────────────────────────────────────────

  describe('free-shipping threshold', () => {
    test('exactly $100 does NOT qualify for free shipping', () => {
      // This asserts current buggy behavior.
      // Correct would be: shippingPrice = '0.00' at $100 or above.
      // The comparison is `itemsPrice > 100` where itemsPrice is a string
      // ("100.00"). JS coerces it to 100.00; 100.00 > 100 is false, so
      // shipping is charged. The intended cutoff appears to be ≥ $100.
      const result = calcPrices([{ price: 100, qty: 1 }])
      expect(result.itemsPrice).toBe('100.00')
      expect(result.shippingPrice).toBe('100.00') // bug: should be '0.00'
      expect(result.taxPrice).toBe('15.00')
      expect(result.totalPrice).toBe('215.00')
    })

    test('$100.01 qualifies for free shipping', () => {
      const result = calcPrices([{ price: 100.01, qty: 1 }])
      expect(result.shippingPrice).toBe('0.00')
      expect(result.taxPrice).toBe('15.00')
      expect(result.totalPrice).toBe('115.01')
    })

    test('$99.99 does not qualify for free shipping', () => {
      const result = calcPrices([{ price: 99.99, qty: 1 }])
      expect(result.shippingPrice).toBe('100.00')
    })
  })

  // ── Empty cart ────────────────────────────────────────────────────────────

  describe('empty cart', () => {
    test('itemsPrice is "0.00" but shipping is still charged', () => {
      const result = calcPrices([])
      expect(result.itemsPrice).toBe('0.00')
      expect(result.shippingPrice).toBe('100.00')
      expect(result.taxPrice).toBe('0.00')
      expect(result.totalPrice).toBe('100.00')
    })
  })

  // ── Floating point ────────────────────────────────────────────────────────

  describe('floating point', () => {
    test('0.1 + 0.2 is handled correctly by addDecimals', () => {
      const result = calcPrices([
        { price: 0.1, qty: 1 },
        { price: 0.2, qty: 1 },
      ])
      // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754; addDecimals normalises to "0.30"
      expect(result.itemsPrice).toBe('0.30')
    })

    test('tax on $0.30 rounds down to "0.04"', () => {
      const result = calcPrices([
        { price: 0.1, qty: 1 },
        { price: 0.2, qty: 1 },
      ])
      // 0.15 × 0.30 = 0.045 (displayed), but the IEEE 754 value is slightly
      // below 0.045, so toFixed(2) rounds DOWN → "0.04", not "0.05".
      expect(result.taxPrice).toBe('0.04')
      expect(result.totalPrice).toBe('100.34')
    })
  })

  // ── Malformed inputs ──────────────────────────────────────────────────────

  describe('malformed inputs', () => {
    test('undefined price — NaN propagates silently through all fields', () => {
      // This asserts current buggy behavior.
      // Correct would be: throw a validation error or filter out invalid items.
      // Instead, NaN propagates through the calculation chain. Only
      // shippingPrice survives because "NaN" > 100 is false (charges shipping).
      const result = calcPrices([{ price: undefined, qty: 1 }])
      expect(result.itemsPrice).toBe('NaN')
      expect(result.shippingPrice).toBe('100.00')
      expect(result.taxPrice).toBe('NaN')
      expect(result.totalPrice).toBe('NaN')
    })

    test('null price — null coerces to 0 in multiplication', () => {
      // null * qty = 0 in JS; item is silently treated as free
      const result = calcPrices([{ price: null, qty: 2 }])
      expect(result.itemsPrice).toBe('0.00')
      expect(result.shippingPrice).toBe('100.00')
      expect(result.taxPrice).toBe('0.00')
      expect(result.totalPrice).toBe('100.00')
    })

    test('qty = 0 — item contributes nothing to total', () => {
      const result = calcPrices([{ price: 999, qty: 0 }])
      expect(result.itemsPrice).toBe('0.00')
      expect(result.shippingPrice).toBe('100.00')
      expect(result.totalPrice).toBe('100.00')
    })

    test('string price — JS coercion makes multiplication work', () => {
      // '49.99' * 2 coerces to 99.98; no error is thrown
      const result = calcPrices([{ price: '49.99', qty: 2 }])
      expect(result.itemsPrice).toBe('99.98')
      expect(result.shippingPrice).toBe('100.00')
    })
  })

})