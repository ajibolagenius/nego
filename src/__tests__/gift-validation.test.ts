/**
 * Gift Validation Tests
 * 
 * Unit tests for the gift validation library.
 * Run with: npx jest src/__tests__/gift-validation.test.ts
 */

import { 
  isValidUUID, 
  isValidAmount, 
  isValidMessage,
  validateGiftRequest, 
  sanitizeGiftRequest,
  GIFT_CONSTANTS 
} from '../lib/gift-validation'

describe('Gift Validation', () => {
  describe('isValidUUID', () => {
    it('accepts valid UUIDs', () => {
      expect(isValidUUID('00000000-0000-0000-0000-000000000001')).toBe(true)
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(isValidUUID('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true)
    })

    it('rejects invalid UUIDs', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false)
      expect(isValidUUID('12345')).toBe(false)
      expect(isValidUUID('')).toBe(false)
      expect(isValidUUID(null)).toBe(false)
      expect(isValidUUID(undefined)).toBe(false)
      expect(isValidUUID(123)).toBe(false)
      expect(isValidUUID('00000000-0000-0000-0000-00000000000')).toBe(false) // too short
      expect(isValidUUID('00000000-0000-0000-0000-0000000000001')).toBe(false) // too long
    })
  })

  describe('isValidAmount', () => {
    it('accepts valid amounts', () => {
      expect(isValidAmount(100)).toBe(true)
      expect(isValidAmount(500)).toBe(true)
      expect(isValidAmount(1000000)).toBe(true)
    })

    it('rejects invalid amounts', () => {
      expect(isValidAmount(99)).toBe(false) // below minimum
      expect(isValidAmount(1000001)).toBe(false) // above maximum
      expect(isValidAmount(0)).toBe(false)
      expect(isValidAmount(-100)).toBe(false)
      expect(isValidAmount(100.5)).toBe(false) // not an integer
      expect(isValidAmount('100')).toBe(false)
      expect(isValidAmount(null)).toBe(false)
    })
  })

  describe('isValidMessage', () => {
    it('accepts valid messages', () => {
      expect(isValidMessage('Hello!')).toBe(true)
      expect(isValidMessage('')).toBe(true)
      expect(isValidMessage(null)).toBe(true)
      expect(isValidMessage(undefined)).toBe(true)
      expect(isValidMessage('A'.repeat(500))).toBe(true)
    })

    it('rejects invalid messages', () => {
      expect(isValidMessage('A'.repeat(501))).toBe(false) // too long
      expect(isValidMessage(123)).toBe(false)
    })
  })

  describe('validateGiftRequest', () => {
    const validRequest = {
      senderId: '00000000-0000-0000-0000-000000000001',
      recipientId: '00000000-0000-0000-0000-000000000002',
      amount: 100,
    }

    it('accepts valid requests', () => {
      expect(validateGiftRequest(validRequest).valid).toBe(true)
      expect(validateGiftRequest({ ...validRequest, message: 'Hello!' }).valid).toBe(true)
    })

    it('rejects missing senderId', () => {
      const result = validateGiftRequest({ ...validRequest, senderId: undefined })
      expect(result.valid).toBe(false)
      expect(result.field).toBe('senderId')
    })

    it('rejects invalid senderId', () => {
      const result = validateGiftRequest({ ...validRequest, senderId: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.field).toBe('senderId')
    })

    it('rejects self-gifting', () => {
      const result = validateGiftRequest({ 
        ...validRequest, 
        recipientId: validRequest.senderId 
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('yourself')
    })

    it('rejects amount below minimum', () => {
      const result = validateGiftRequest({ ...validRequest, amount: 50 })
      expect(result.valid).toBe(false)
      expect(result.field).toBe('amount')
    })

    it('rejects non-object input', () => {
      expect(validateGiftRequest(null).valid).toBe(false)
      expect(validateGiftRequest('string').valid).toBe(false)
      expect(validateGiftRequest(123).valid).toBe(false)
    })
  })

  describe('sanitizeGiftRequest', () => {
    it('sanitizes and normalizes input', () => {
      const result = sanitizeGiftRequest({
        senderId: '  00000000-0000-0000-0000-000000000001  ',
        recipientId: '00000000-0000-0000-0000-000000000002',
        amount: '150.7',
        message: '  Hello!  ',
      })

      expect(result.senderId).toBe('00000000-0000-0000-0000-000000000001')
      expect(result.amount).toBe(150)
      expect(result.message).toBe('Hello!')
      expect(result.senderName).toBe('Someone')
      expect(result.recipientName).toBe('Talent')
    })

    it('handles missing optional fields', () => {
      const result = sanitizeGiftRequest({
        senderId: '00000000-0000-0000-0000-000000000001',
        recipientId: '00000000-0000-0000-0000-000000000002',
        amount: 100,
      })

      expect(result.message).toBeNull()
      expect(result.senderName).toBe('Someone')
      expect(result.recipientName).toBe('Talent')
    })

    it('truncates long messages', () => {
      const longMessage = 'A'.repeat(600)
      const result = sanitizeGiftRequest({
        senderId: '00000000-0000-0000-0000-000000000001',
        recipientId: '00000000-0000-0000-0000-000000000002',
        amount: 100,
        message: longMessage,
      })

      expect(result.message?.length).toBe(GIFT_CONSTANTS.MAX_MESSAGE_LENGTH)
    })
  })

  describe('GIFT_CONSTANTS', () => {
    it('has expected values', () => {
      expect(GIFT_CONSTANTS.MIN_AMOUNT).toBe(100)
      expect(GIFT_CONSTANTS.MAX_AMOUNT).toBe(1000000)
      expect(GIFT_CONSTANTS.MAX_MESSAGE_LENGTH).toBe(500)
      expect(GIFT_CONSTANTS.PRESET_AMOUNTS).toContain(100)
      expect(GIFT_CONSTANTS.PRESET_AMOUNTS).toContain(500)
    })
  })
})
