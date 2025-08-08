import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'

const app = new Hono()

// CORS middleware for all routes
app.use('*', cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Logger middleware
app.use('*', logger(console.log))

// Health check endpoint - NO JWT verification required
app.get('/working-server-2025/health', (c) => {
  console.log('Health check endpoint called')
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'working-server-2025 is operational',
    version: '2025.1.0'
  })
})

// Main health endpoint
app.get('/health', (c) => {
  console.log('Main health endpoint called')
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'working-server-2025 main health check',
    version: '2025.1.0'
  })
})

// Root endpoint
app.get('/', (c) => {
  console.log('Root endpoint called')
  return c.json({ 
    message: 'working-server-2025 API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/working-server-2025/health'
    ]
  })
})

// Test endpoint
app.get('/working-server-2025/test', (c) => {
  console.log('Test endpoint called')
  return c.json({ 
    test: 'success',
    message: 'working-server-2025 test endpoint working',
    timestamp: new Date().toISOString()
  })
})

// Catch-all for debugging
app.all('*', (c) => {
  console.log(`Unmatched route: ${c.req.method} ${c.req.url}`)
  return c.json({ 
    error: 'Route not found',
    method: c.req.method,
    url: c.req.url,
    message: 'This is working-server-2025 - available endpoints: /, /health, /working-server-2025/health, /working-server-2025/test'
  }, 404)
})

console.log('Starting working-server-2025...')
serve(app.fetch)