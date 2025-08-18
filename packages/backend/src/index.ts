import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import 'dotenv/config'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())

// CORS configuration
app.use('*', cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}))

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    message: 'ReadZone API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  })
})

// API routes
app.get('/api', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to ReadZone API',
    version: '1.0.0',
    docs: '/api/docs',
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'API endpoint not found',
    path: c.req.path,
  }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  
  return c.json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  }, 500)
})

const port = process.env.PORT ? Number(process.env.PORT) : 3001

console.info(`🚀 ReadZone API Server starting...`)
console.info(`📍 Environment: ${process.env.NODE_ENV ?? 'development'}`)
console.info(`🌐 Server will run on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

console.info(`✅ ReadZone API Server is running on http://localhost:${port}`)