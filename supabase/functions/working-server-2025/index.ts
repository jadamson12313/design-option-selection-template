import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname

    // Health check endpoint
    if (path === '/health' || path === '/') {
      return new Response(
        JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          function: 'working-server-2025',
          jwt_disabled: true,
          message: 'Ready for deployment'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sync upload endpoint
    if (path === '/sync/upload' && req.method === 'POST') {
      const body = await req.json()
      const { projectData, projectId, userEmail } = body

      if (!projectData || !projectId || !userEmail) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: projectData, projectId, userEmail' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Sync upload for user: ${userEmail}, project: ${projectId}`)

      // Simple success response (you can add actual storage logic here)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Data uploaded successfully',
          projectId,
          userEmail,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Sync download endpoint
    if (path.startsWith('/sync/download/') && req.method === 'GET') {
      const projectId = path.split('/sync/download/')[1]
      const userEmail = url.searchParams.get('userEmail')

      if (!projectId || !userEmail) {
        return new Response(
          JSON.stringify({ error: 'Missing projectId or userEmail' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Sync download for user: ${userEmail}, project: ${projectId}`)

      // Return empty project data for now (you can add actual storage logic here)
      return new Response(
        JSON.stringify({ 
          projectData: {},
          projectId,
          userEmail,
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test endpoint
    if (path === '/test') {
      return new Response(
        JSON.stringify({ 
          test: 'success',
          message: 'working-server-2025 is functioning correctly',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 404 for unknown paths
    return new Response(
      JSON.stringify({ 
        error: 'Not found',
        available_endpoints: [
          '/',
          '/health',
          '/test',
          '/sync/upload (POST)',
          '/sync/download/{projectId} (GET)'
        ]
      }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})