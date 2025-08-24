import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import 'dotenv/config'

const app = new OpenAPIHono()

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

// Import routes
import reviewRoutes from './routes/reviews'
import { content as contentRoutes } from './routes/content'
import authRoutes from './routes/auth'
import { createSwaggerUI, getOpenAPISpec } from './lib/swagger'

// API routes
app.get('/api', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to ReadZone API',
    version: '1.0.0',
    docs: '/api/docs',
  })
})

// Register routes
app.route('/api/reviews', reviewRoutes)
app.route('/api/content', contentRoutes)
app.route('/api/auth', authRoutes)

// Swagger documentation
app.doc('/api/docs/openapi.json', getOpenAPISpec())

app.get('/api/docs', createSwaggerUI())
app.get('/api/docs/*', createSwaggerUI())

// Temporary basic feed endpoint for testing
app.get('/api/reviews/feed', (c) => {
  const { tab: _tab = 'recommended', limit: _limit = 20 } = c.req.query()
  
  // Return mock data for now
  const mockReviews = [
    {
      id: '1',
      content: '어른이 되어 다시 읽는 어린왕자는 어린 시절과는 다른 감동을 줍니다...',
      createdAt: new Date().toISOString(),
      author: {
        id: 'user1',
        username: '책벌레김',
        profileImage: null
      },
      book: {
        id: 'book1',
        title: '어린왕자',
        author: '앙투안 드 생텍쥐페리',
        cover: null
      },
      stats: {
        likes: 5,
        comments: 2,
        shares: 0
      },
      userInteraction: null
    }
  ]
  
  return c.json({
    success: true,
    reviews: mockReviews,
    nextCursor: null,
    hasMore: false
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