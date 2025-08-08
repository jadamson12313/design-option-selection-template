import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

// Check environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('=== NO-JWT NO-EMAIL-CONFIRMATION SERVER ===');
console.log('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');
console.log('🔥 JWT AUTHENTICATION GLOBALLY DISABLED');
console.log('🔥 EMAIL CONFIRMATION GLOBALLY DISABLED');

// Initialize Supabase client
const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// Helper function to validate user by email (NO JWT REQUIRED)
const validateUserByEmail = async (userEmail: string) => {
  if (!userEmail) {
    return { error: { code: 400, message: 'userEmail is required' } };
  }

  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('🔥 Failed to list users:', listError);
      return { error: { code: 500, message: 'Database error during user validation' } };
    }

    const user = users?.users?.find(u => u.email === userEmail);
    
    if (!user) {
      return { error: { code: 401, message: 'User not found. Please sign in again.' } };
    }

    return { user };
  } catch (error) {
    console.error('🔥 User validation error:', error);
    return { error: { code: 500, message: 'User validation failed' } };
  }
};

// Simplified signup handler - NO EMAIL CONFIRMATION REQUIRED
const handleSignup = async (request: Request) => {
  console.log('🔥 SIMPLE SIGNUP HANDLER - NO JWT, NO EMAIL CONFIRMATION');
  
  try {
    const rawBody = await request.text();
    if (!rawBody.trim()) {
      return new Response(JSON.stringify({
        code: 400,
        message: 'Request body is empty'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { email, password, name, teamId } = JSON.parse(rawBody);
    console.log('🔥 Signup request for:', email);

    if (!email || !password || !name) {
      return new Response(JSON.stringify({
        code: 400,
        message: 'Email, password, and name are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('🔥 Failed to list users:', listError);
      return new Response(JSON.stringify({
        code: 500,
        message: 'Database error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('🔥 User already exists');
      return new Response(JSON.stringify({
        code: 400,
        message: 'An account with this email already exists. Please sign in instead.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create new user with auto-confirmation (since email confirmation is disabled)
    console.log('🔥 Creating new user with auto-confirmation...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        teamId: teamId || null,
        joinedAt: new Date().toISOString()
      },
      email_confirm: true, // Auto-confirm since email confirmation is disabled globally
      email_confirmed_at: new Date().toISOString(),
      app_metadata: {
        email_confirmed: true,
        provider: 'email',
        providers: ['email']
      }
    });

    if (createError || !newUser.user) {
      console.error('🔥 User creation failed:', createError);
      return new Response(JSON.stringify({
        code: 400,
        message: `Failed to create user: ${createError?.message || 'Unknown error'}`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔥 User created successfully:', newUser.user.id);
    console.log('🔥 Email auto-confirmed (no confirmation needed)');

    return new Response(JSON.stringify({
      user: newUser.user,
      emailConfirmed: true,
      message: 'Account created successfully! You can now sign in immediately.',
      needsManualConfirmation: false
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔥 SIGNUP ERROR:', error);
    return new Response(JSON.stringify({
      code: 500,
      message: 'Internal server error during signup',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

// Main request handler
const handleRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const path = url.pathname;
  
  console.log(`🔥 NO-JWT REQUEST HANDLER: ${request.method} ${path}`);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Health check endpoints
  if ((path === '/health' || 
       path === '/server-deployment/health' || 
       path === '/server/health') && 
      request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'server-no-jwt-no-email',
      message: 'No-JWT No-Email-Confirmation server running',
      authMethod: 'email-based',
      emailConfirmation: 'disabled',
      jwtAuthentication: 'disabled',
      features: ['signup', 'cloud-sync', 'collaboration']
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'POST') {
    // SIGNUP ROUTES - NO EMAIL CONFIRMATION REQUIRED
    if (path.includes('signup') || path.includes('/auth/signup')) {
      return await handleSignup(request);
    }

    // EMAIL CONFIRMATION ROUTES - NOW DEPRECATED BUT KEPT FOR COMPATIBILITY
    if (path.includes('/confirm') || path.includes('/fix-email')) {
      console.log('🔥 EMAIL CONFIRMATION REQUEST (DEPRECATED - AUTO-CONFIRMING)');
      
      try {
        const { email } = await request.json();
        
        if (!email) {
          return new Response(JSON.stringify({
            code: 400,
            message: 'Email is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Since email confirmation is disabled, just return success
        return new Response(JSON.stringify({
          message: 'Email confirmation is disabled. All accounts are auto-confirmed.',
          confirmed: true
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          code: 500,
          message: 'Email confirmation is disabled'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // SYNC UPLOAD - NO JWT REQUIRED
    if (path === '/sync/upload') {
      console.log('🔥 PUBLIC SYNC UPLOAD - NO JWT AUTHENTICATION');
      
      try {
        const { projectData, projectId, userEmail } = await request.json();
        
        if (!projectData || !projectId || !userEmail) {
          return new Response(JSON.stringify({
            code: 400,
            message: 'projectData, projectId, and userEmail are required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const userValidation = await validateUserByEmail(userEmail);
        if (userValidation.error) {
          return new Response(JSON.stringify(userValidation.error), {
            status: userValidation.error.code,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const user = userValidation.user;
        const dataKey = `project:${projectId}:data`;
        const metaKey = `project:${projectId}:meta`;
        
        await kv.set(dataKey, projectData);
        await kv.set(metaKey, {
          projectId,
          ownerId: user.id,
          ownerEmail: user.email,
          lastSyncAt: new Date().toISOString(),
          teamId: user.user_metadata?.teamId || null
        });

        console.log('🔥 Sync upload successful for user:', userEmail);

        return new Response(JSON.stringify({ 
          message: 'Data synced successfully',
          projectId,
          syncedAt: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('🔥 Sync upload error:', error);
        return new Response(JSON.stringify({ 
          code: 500,
          message: 'Failed to sync data',
          details: error instanceof Error ? error.message : String(error)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // COLLABORATION OPERATION - NO JWT REQUIRED
    if (path === '/collaboration/operation') {
      console.log('🔥 PUBLIC COLLABORATION OPERATION - NO JWT AUTHENTICATION');
      
      try {
        const { operation, userEmail } = await request.json();
        
        if (!operation || !userEmail) {
          return new Response(JSON.stringify({
            code: 400,
            message: 'operation and userEmail are required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const userValidation = await validateUserByEmail(userEmail);
        if (userValidation.error) {
          return new Response(JSON.stringify(userValidation.error), {
            status: userValidation.error.code,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('🔥 Collaboration operation for user:', userEmail);

        // Simply return success (collaboration features work locally)
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('🔥 Collaboration operation error:', error);
        return new Response(JSON.stringify({ 
          code: 500,
          message: 'Failed to store operation',
          details: error instanceof Error ? error.message : String(error)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
  }

  if (request.method === 'GET') {
    // SYNC DOWNLOAD - NO JWT REQUIRED
    if (path.startsWith('/sync/download/')) {
      console.log('🔥 PUBLIC SYNC DOWNLOAD - NO JWT AUTHENTICATION');
      
      try {
        const pathParts = path.split('/');
        const projectId = pathParts[pathParts.length - 1];
        const userEmail = url.searchParams.get('userEmail');
        
        if (!projectId || !userEmail) {
          return new Response(JSON.stringify({
            code: 400,
            message: 'projectId and userEmail are required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const userValidation = await validateUserByEmail(userEmail);
        if (userValidation.error) {
          return new Response(JSON.stringify(userValidation.error), {
            status: userValidation.error.code,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const dataKey = `project:${projectId}:data`;
        const metaKey = `project:${projectId}:meta`;
        
        const projectData = await kv.get(dataKey);
        const projectMeta = await kv.get(metaKey);
        
        if (!projectData) {
          return new Response(JSON.stringify({
            code: 404,
            message: 'Project data not found'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('🔥 Sync download successful for user:', userEmail);

        return new Response(JSON.stringify({ 
          projectData,
          metadata: projectMeta || null,
          downloadedAt: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('🔥 Sync download error:', error);
        return new Response(JSON.stringify({ 
          code: 500,
          message: 'Failed to download data',
          details: error instanceof Error ? error.message : String(error)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // COLLABORATION ACTIVITY - NO JWT REQUIRED (return empty for now)
    if (path.startsWith('/collaboration/activity/')) {
      console.log('🔥 PUBLIC COLLABORATION ACTIVITY - NO JWT AUTHENTICATION');
      
      const userEmail = url.searchParams.get('userEmail');
      
      if (!userEmail) {
        return new Response(JSON.stringify({
          code: 400,
          message: 'userEmail is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userValidation = await validateUserByEmail(userEmail);
      if (userValidation.error) {
        return new Response(JSON.stringify(userValidation.error), {
          status: userValidation.error.code,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ activities: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // TEAM MEMBERS - NO JWT REQUIRED
    if (path.startsWith('/teams/') && path.includes('/members')) {
      console.log('🔥 PUBLIC TEAM MEMBERS - NO JWT AUTHENTICATION');
      
      const userEmail = url.searchParams.get('userEmail');
      
      if (!userEmail) {
        return new Response(JSON.stringify({
          code: 400,
          message: 'userEmail is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userValidation = await validateUserByEmail(userEmail);
      if (userValidation.error) {
        return new Response(JSON.stringify(userValidation.error), {
          status: userValidation.error.code,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const user = userValidation.user;
      return new Response(JSON.stringify({ 
        members: [{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || 'User',
          role: 'admin'
        }]
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SYNC VERSION - NO JWT REQUIRED
    if (path === '/sync/version') {
      console.log('🔥 PUBLIC SYNC VERSION - NO JWT AUTHENTICATION');
      
      const userEmail = url.searchParams.get('userEmail');
      
      if (!userEmail) {
        return new Response(JSON.stringify({
          code: 400,
          message: 'userEmail is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userValidation = await validateUserByEmail(userEmail);
      if (userValidation.error) {
        return new Response(JSON.stringify(userValidation.error), {
          status: userValidation.error.code,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PROJECTS LIST - NO JWT REQUIRED
    if (path === '/projects') {
      console.log('🔥 PUBLIC PROJECTS LIST - NO JWT AUTHENTICATION');
      
      const userEmail = url.searchParams.get('userEmail');
      
      if (!userEmail) {
        return new Response(JSON.stringify({
          code: 400,
          message: 'userEmail is required'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const userValidation = await validateUserByEmail(userEmail);
      if (userValidation.error) {
        return new Response(JSON.stringify(userValidation.error), {
          status: userValidation.error.code,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ projects: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  // 404 for unmatched routes
  console.log('🔥 404 NOT FOUND:', request.method, path);
  return new Response(JSON.stringify({ 
    error: 'Route not found',
    method: request.method,
    path: path,
    message: 'This server uses email-based authentication only (no JWT, no email confirmation)'
  }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
};

console.log('🔥 NO-JWT NO-EMAIL-CONFIRMATION SERVER READY');
console.log('🔥 All endpoints use email-based authentication');
console.log('🔥 JWT authentication is globally disabled');
console.log('🔥 Email confirmation is globally disabled');

// Start the server
Deno.serve(handleRequest);