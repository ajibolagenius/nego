/**
 * Gift Validation Library
 * 
 * Centralized validation rules for the gifting system.
 * Used by both frontend and API to ensure consistent validation.
 */

// Constants
export const GIFT_CONSTANTS = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 1000000,
  MAX_MESSAGE_LENGTH: 500,
  PRESET_AMOUNTS: [100, 500, 1000, 2500, 5000],
} as const

// UUID validation regex - RFC 4122 compliant
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Validates a UUID string
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return UUID_REGEX.test(value)
}

/**
 * Validates gift amount
 */
export function isValidAmount(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return false
  return value >= GIFT_CONSTANTS.MIN_AMOUNT && value <= GIFT_CONSTANTS.MAX_AMOUNT
}

/**
 * Validates gift message
 */
export function isValidMessage(value: unknown): value is string | null | undefined {
  if (value === null || value === undefined || value === '') return true
  if (typeof value !== 'string') return false
  return value.length <= GIFT_CONSTANTS.MAX_MESSAGE_LENGTH
}

/**
 * Gift request payload interface
 */
export interface GiftRequest {
  senderId: string
  recipientId: string
  amount: number
  message?: string | null
  senderName?: string
  recipientName?: string
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  field?: string
}

/**
 * Validates a complete gift request
 */
export function validateGiftRequest(data: unknown): ValidationResult {
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body', field: 'body' }
  }

  const request = data as Record<string, unknown>

  // Validate senderId
  if (!request.senderId) {
    return { valid: false, error: 'Sender ID is required', field: 'senderId' }
  }
  if (!isValidUUID(request.senderId)) {
    return { valid: false, error: 'Invalid sender ID format. Must be a valid UUID.', field: 'senderId' }
  }

  // Validate recipientId
  if (!request.recipientId) {
    return { valid: false, error: 'Recipient ID is required', field: 'recipientId' }
  }
  if (!isValidUUID(request.recipientId)) {
    return { valid: false, error: 'Invalid recipient ID format. Must be a valid UUID.', field: 'recipientId' }
  }

  // Check self-gifting
  if (request.senderId === request.recipientId) {
    return { valid: false, error: 'You cannot send a gift to yourself', field: 'recipientId' }
  }

  // Validate amount
  if (request.amount === undefined || request.amount === null) {
    return { valid: false, error: 'Gift amount is required', field: 'amount' }
  }
  
  const amount = Number(request.amount)
  if (isNaN(amount) || !Number.isInteger(amount)) {
    return { valid: false, error: 'Gift amount must be a whole number', field: 'amount' }
  }
  
  if (amount < GIFT_CONSTANTS.MIN_AMOUNT) {
    return { valid: false, error: `Minimum gift amount is ${GIFT_CONSTANTS.MIN_AMOUNT} coins`, field: 'amount' }
  }
  
  if (amount > GIFT_CONSTANTS.MAX_AMOUNT) {
    return { valid: false, error: `Maximum gift amount is ${GIFT_CONSTANTS.MAX_AMOUNT} coins`, field: 'amount' }
  }

  // Validate message (optional)
  if (request.message !== undefined && request.message !== null && request.message !== '') {
    if (typeof request.message !== 'string') {
      return { valid: false, error: 'Message must be a string', field: 'message' }
    }
    if (request.message.length > GIFT_CONSTANTS.MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message cannot exceed ${GIFT_CONSTANTS.MAX_MESSAGE_LENGTH} characters`, field: 'message' }
    }
  }

  return { valid: true }
}

/**
 * Sanitizes a gift request, converting types as needed
 */
export function sanitizeGiftRequest(data: Record<string, unknown>): GiftRequest {
  return {
    senderId: String(data.senderId || '').trim(),
    recipientId: String(data.recipientId || '').trim(),
    amount: Math.floor(Number(data.amount) || 0),
    message: data.message ? String(data.message).trim().slice(0, GIFT_CONSTANTS.MAX_MESSAGE_LENGTH) : null,
    senderName: data.senderName ? String(data.senderName).trim() : 'Someone',
    recipientName: data.recipientName ? String(data.recipientName).trim() : 'Talent',
  }
}
