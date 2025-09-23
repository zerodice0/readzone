import React, { useCallback, useEffect, useRef } from 'react'
import { rateLimiter, securityLogger, validateInput, xssProtection } from '@/utils/security'

interface SecureFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSecureSubmit?: (data: FormData, event: React.FormEvent) => void
  rateLimitKey?: string
  maxSubmissions?: number
  submissionWindowMs?: number
  validateInputs?: boolean
  sanitizeInputs?: boolean
  children: React.ReactNode
}

export const SecureForm: React.FC<SecureFormProps> = ({
  onSecureSubmit,
  rateLimitKey,
  maxSubmissions = 5,
  submissionWindowMs = 60000, // 1 minute
  validateInputs = true,
  sanitizeInputs = true,
  children,
  onSubmit,
  ...props
}) => {
  const formRef = useRef<HTMLFormElement>(null)
  const submissionCount = useRef(0)

  useEffect(() => {
    // Add honeypot field for bot detection
    if (formRef.current) {
      const honeypot = document.createElement('input')

      honeypot.type = 'text'
      honeypot.name = 'website' // Common honeypot field name
      honeypot.style.position = 'absolute'
      honeypot.style.left = '-9999px'
      honeypot.style.visibility = 'hidden'
      honeypot.setAttribute('tabindex', '-1')
      honeypot.setAttribute('autocomplete', 'off')
      formRef.current.appendChild(honeypot)

      return () => {
        if (honeypot.parentNode) {
          honeypot.parentNode.removeChild(honeypot)
        }
      }
    }

    return undefined
  }, [])

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    // Check honeypot
    const honeypotValue = formData.get('website')

    if (honeypotValue && typeof honeypotValue === 'string' && honeypotValue.trim() !== '') {
      securityLogger.logSecurityEvent({
        type: 'csrf_attempt',
        details: 'Honeypot field filled',
        severity: 'medium'
      })

      return
    }

    // Rate limiting
    const limitKey = rateLimitKey ?? `form:${window.location.pathname}`

    if (!rateLimiter.isAllowed(limitKey, maxSubmissions, submissionWindowMs)) {
      securityLogger.logSecurityEvent({
        type: 'rate_limit',
        details: `Form submission rate limit exceeded: ${limitKey}`,
        severity: 'medium'
      })
      console.warn('Rate limit exceeded: too many requests')

      return
    }

    // Input validation and sanitization
    const sanitizedData = new FormData()
    let hasValidationErrors = false

    for (const [key, value] of formData.entries()) {
      if (key === 'website') {continue} // Skip honeypot

      if (typeof value === 'string') {
        let sanitizedValue = value

        // Sanitize input
        if (sanitizeInputs) {
          sanitizedValue = xssProtection.escapeHtml(value.trim())
        }

        // Validate specific input types
        if (validateInputs) {
          if (key.includes('email')) {
            if (!validateInput.email(sanitizedValue)) {
              hasValidationErrors = true
              securityLogger.logSecurityEvent({
                type: 'invalid_input',
                details: `Invalid email format: ${key}`,
                severity: 'low'
              })
            }
          } else if (key.includes('username') || key.includes('userid')) {
            if (!validateInput.username(sanitizedValue)) {
              hasValidationErrors = true
              securityLogger.logSecurityEvent({
                type: 'invalid_input',
                details: `Invalid username format: ${key}`,
                severity: 'low'
              })
            }
          } else if (key.includes('password')) {
            const validation = validateInput.password(sanitizedValue)

            if (!validation.valid) {
              hasValidationErrors = true
              securityLogger.logSecurityEvent({
                type: 'invalid_input',
                details: `Weak password: ${validation.feedback.join(', ')}`,
                severity: 'low'
              })
            }
          }
        }

        // Check for potential XSS attempts
        if (/<script|javascript:|data:|vbscript:/i.test(value)) {
          securityLogger.logSecurityEvent({
            type: 'xss_attempt',
            details: `Potential XSS in field: ${key}`,
            severity: 'high'
          })
          hasValidationErrors = true
        }

        sanitizedData.append(key, sanitizedValue)
      } else {
        sanitizedData.append(key, value)
      }
    }

    // Stop submission if validation failed
    if (hasValidationErrors) {
      return
    }

    submissionCount.current += 1

    // Call the secure submit handler
    if (onSecureSubmit) {
      onSecureSubmit(sanitizedData, event)
    } else if (onSubmit) {
      onSubmit(event)
    }
  }, [
    onSecureSubmit,
    onSubmit,
    rateLimitKey,
    maxSubmissions,
    submissionWindowMs,
    validateInputs,
    sanitizeInputs
  ])

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      autoComplete="on"
      noValidate={false} // Let browser do basic validation first
      {...props}
    >
      {children}
    </form>
  )
}

// Secure input components
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  validateOnChange?: boolean
  sanitizeOnChange?: boolean
  showValidation?: boolean
}

export const SecureInput: React.FC<SecureInputProps> = ({
  validateOnChange = false,
  sanitizeOnChange = false,
  showValidation = false,
  onChange,
  onBlur,
  ...props
}) => {
  const [validationState, setValidationState] = React.useState<{
    isValid: boolean
    message: string
  }>({ isValid: true, message: '' })

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value

    // Sanitize on change if enabled
    if (sanitizeOnChange) {
      value = xssProtection.escapeHtml(value)
      event.target.value = value
    }

    // Validate on change if enabled
    if (validateOnChange && showValidation) {
      let isValid = true
      let message = ''

      const { type, name } = event.target

      if (type === 'email' || name?.includes('email')) {
        isValid = validateInput.email(value)
        message = isValid ? '' : '올바른 이메일 형식이 아닙니다'
      } else if (name?.includes('username') || name?.includes('userid')) {
        isValid = validateInput.username(value)
        message = isValid ? '' : '사용자명은 3-30자의 영문, 숫자, _, -만 사용 가능합니다'
      } else if (type === 'password') {
        const validation = validateInput.password(value)

        isValid = validation.valid
        message = validation.feedback.join(', ')
      }

      setValidationState({ isValid, message })
    }

    onChange?.(event)
  }, [validateOnChange, sanitizeOnChange, showValidation, onChange])

  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    // Additional validation on blur
    if (showValidation && !validationState.isValid) {
      // Show validation message more prominently
    }

    onBlur?.(event)
  }, [onBlur, showValidation, validationState])

  return (
    <div className="relative">
      <input
        {...props}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`${props.className ?? ''} ${
          showValidation && !validationState.isValid ? 'border-red-500' : ''
        }`}
      />
      {showValidation && validationState.message && (
        <div className="text-red-500 text-sm mt-1">
          {validationState.message}
        </div>
      )}
    </div>
  )
}

// Secure textarea component
interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxSafeLength?: number
  stripHtml?: boolean
  allowedTags?: string[]
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  maxSafeLength = 5000,
  stripHtml = false,
  allowedTags = [],
  onChange,
  ...props
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = event.target.value

    // Length limit
    if (value.length > maxSafeLength) {
      value = value.substring(0, maxSafeLength)
      event.target.value = value
    }

    // HTML stripping or validation
    if (stripHtml) {
      value = value.replace(/<[^>]*>/g, '')
      event.target.value = value
    } else if (allowedTags.length === 0) {
      // Check for potentially dangerous HTML
      if (/<script|<object|<embed|<iframe/i.test(value)) {
        securityLogger.logSecurityEvent({
          type: 'xss_attempt',
          details: 'Dangerous HTML detected in textarea',
          severity: 'high'
        })
        // Remove dangerous tags
        value = value.replace(/<(script|object|embed|iframe)[^>]*>.*?<\/\1>/gi, '')
        event.target.value = value
      }
    }

    onChange?.(event)
  }, [maxSafeLength, stripHtml, allowedTags, onChange])

  return (
    <textarea
      {...props}
      onChange={handleChange}
      maxLength={maxSafeLength}
    />
  )
}

// CSRF token component
export const CSRFToken: React.FC = () => {
  const [token, setToken] = React.useState<string>('')

  React.useEffect(() => {
    // Generate or get CSRF token
    const existingToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')

    if (existingToken) {
      setToken(existingToken)
    } else {
      // Generate new token
      const newToken = crypto.randomUUID()

      setToken(newToken)

      // Store in meta tag
      const metaTag = document.createElement('meta')

      metaTag.name = 'csrf-token'
      metaTag.content = newToken
      document.head.appendChild(metaTag)
    }
  }, [])

  return token ? <input type="hidden" name="_token" value={token} /> : null
}