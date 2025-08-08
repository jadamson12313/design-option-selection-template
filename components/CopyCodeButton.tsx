import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Copy, Check, MousePointer, FileText, Files } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CopyCodeButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(false);
  const [copiedKv, setCopiedKv] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(false);
  const [selectedKv, setSelectedKv] = useState(false);
  const indexTextareaRef = useRef<HTMLTextAreaElement>(null);
  const kvTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Version 8.0-minimal - Ultra minimal test to isolate 401 issue
  const codeVersion = '8.0-minimal';
  
  // Ultra minimal index.ts - bypasses all potential issues
  const indexCode = `// ULTRA MINIMAL TEST VERSION - NO IMPORTS, NO DEPENDENCIES
// Version 8.0-minimal - Test if 401 issue is at Supabase function level

console.log('🧪 MINIMAL TEST SERVER STARTING');
console.log('🧪 No imports, no auth, just immediate responses');

// Basic CORS headers
const basicCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};

// Ultra minimal request handler
const minimalHandler = async (request: Request): Promise<Response> => {
  console.log('🧪 MINIMAL HANDLER:', request.method, request.url);
  
  // Extract path without complex URL parsing
  const url = request.url;
  const path = url.split('?')[0]; // Remove query params
  
  console.log('🧪 Processing path:', path);
  
  // Handle CORS immediately
  if (request.method === 'OPTIONS') {
    console.log('🧪 CORS OPTIONS - immediate return');
    return new Response(null, { 
      status: 200, 
      headers: basicCorsHeaders 
    });
  }
  
  // Health endpoint - ultra simple
  if (request.method === 'GET' && path.includes('/health')) {
    console.log('🧪 HEALTH ENDPOINT - immediate response');
    
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Minimal test server working',
      version: '8.0-minimal',
      timestamp: new Date().toISOString(),
      test: 'ultra-minimal-no-auth',
      endpoint: path,
      method: request.method
    }), {
      status: 200,
      headers: { 
        ...basicCorsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
  
  // Debug endpoint - ultra simple
  if (request.method === 'GET' && path.includes('/debug')) {
    console.log('🧪 DEBUG ENDPOINT - immediate response');
    
    return new Response(JSON.stringify({
      status: 'debug-minimal',
      message: 'Minimal debug endpoint working',
      version: '8.0-minimal',
      timestamp: new Date().toISOString(),
      request: {
        method: request.method,
        url: request.url,
        path: path
      },
      test: 'bypassing-all-auth-checks'
    }), {
      status: 200,
      headers: { 
        ...basicCorsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
  
  // Root endpoint - ultra simple
  if (request.method === 'GET' && (path.endsWith('/') || path.includes('make-server-0b7c7173'))) {
    console.log('🧪 ROOT ENDPOINT - immediate response');
    
    return new Response(JSON.stringify({
      service: 'make-server-0b7c7173-minimal',
      status: 'running',
      version: '8.0-minimal',
      message: 'Ultra minimal test server - no auth required',
      timestamp: new Date().toISOString(),
      path: path,
      method: request.method
    }), {
      status: 200,
      headers: { 
        ...basicCorsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
  
  // Fallback - anything else
  console.log('🧪 FALLBACK - unmatched path:', path);
  
  return new Response(JSON.stringify({
    message: 'Minimal test server - unmatched route',
    version: '8.0-minimal',
    timestamp: new Date().toISOString(),
    path: path,
    method: request.method,
    available: ['/health', '/debug', '/']
  }), {
    status: 404,
    headers: { 
      ...basicCorsHeaders, 
      'Content-Type': 'application/json' 
    }
  });
};

console.log('🧪 MINIMAL SERVER READY');
console.log('🧪 Test endpoints:');
console.log('🧪 - /health');
console.log('🧪 - /debug'); 
console.log('🧪 - /');

// Start the minimal server
Deno.serve(minimalHandler);`;

  // Separate kv_store.ts file
  const kvStoreCode = `import { createClient } from 'npm:@supabase/supabase-js@2';

// Get environment variables for KV store
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Create KV client
const kvClient = () => createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

// KV Store interface - all functions exported
export const set = async (key: string, value: any): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").upsert({
    key,
    value
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const get = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_0b7c7173").select("value").eq("key", key).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.value;
};

export const del = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").delete().eq("key", key);
  if (error) {
    throw new Error(error.message);
  }
};

export const mset = async (keys: string[], values: any[]): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  if (error) {
    throw new Error(error.message);
  }
};

export const mget = async (keys: string[]): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_0b7c7173").select("value").in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => d.value) ?? [];
};

export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_0b7c7173").delete().in("key", keys);
  if (error) {
    throw new Error(error.message);
  }
};

export const getByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_0b7c7173").select("key, value").like("key", prefix + "%");
  if (error) {
    throw new Error(error.message);
  }
  return data?.map((d) => ({ key: d.key, value: d.value })) ?? [];
};

console.log('📦 KV Store module loaded successfully');`;

  const selectCode = (type: 'index' | 'kv') => {
    const ref = type === 'index' ? indexTextareaRef : kvTextareaRef;
    const setSelected = type === 'index' ? setSelectedIndex : setSelectedKv;
    
    if (ref.current) {
      ref.current.select();
      ref.current.focus();
      setSelected(true);
      toast.success(`${type === 'index' ? 'Index' : 'KV Store'} code selected! Now click Copy or use Ctrl+C`);
      setTimeout(() => setSelected(false), 3000);
    }
  };

  const copyCode = async (type: 'index' | 'kv') => {
    const code = type === 'index' ? indexCode : kvStoreCode;
    const ref = type === 'index' ? indexTextareaRef : kvTextareaRef;
    const setCopied = type === 'index' ? setCopiedIndex : setCopiedKv;
    const fileName = type === 'index' ? 'index.ts' : 'kv_store.ts';
    
    try {
      if (ref.current) {
        ref.current.select();
        ref.current.focus();
        
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          toast.success(`${fileName} copied to clipboard!`);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      }
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success(`${fileName} copied via clipboard API!`);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      
      toast.error(`Please manually select and copy the ${fileName} code (Ctrl+C)`);
      
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error(`Copy failed. Please manually select the ${fileName} text and use Ctrl+C`);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none hover:from-orange-600 hover:to-red-600"
          >
            <Files className="w-4 h-4 mr-2" />
            Get deployment code (v{codeVersion})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Files className="w-5 h-5" />
              Modular Server Deployment - Version {codeVersion}
              <span className="text-sm font-normal text-gray-500">(Two Files)</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">🧪 MINIMAL TEST Instructions</h4>
              <ol className="text-sm text-red-700 space-y-1">
                <li>1. Go to <a href="https://supabase.com/dashboard/project/btnehreatcbzlglrrpqv/functions" target="_blank" rel="noopener noreferrer" className="underline">Supabase Functions Dashboard</a></li>
                <li>2. REPLACE the existing <code className="bg-red-100 px-1 rounded">make-server-0b7c7173</code> function</li>
                <li>3. Copy and paste ONLY the minimal <strong>index.ts</strong> code below</li>
                <li>4. <strong>DELETE</strong> the kv_store.ts file (not needed for this test)</li>
                <li>5. Deploy the minimal version</li>
                <li>6. Test: <a href="https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173/health" target="_blank" rel="noopener noreferrer" className="underline">Health Check</a></li>
                <li>7. This will tell us if the 401 issue is in Supabase config or our code</li>
              </ol>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">🧪 Ultra Minimal Test v{codeVersion}</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 🧪 NO imports or dependencies whatsoever</li>
                <li>• 🧪 Immediate responses without any auth logic</li>
                <li>• 🧪 Tests if 401 issue is at Supabase function level</li>
                <li>• 🧪 Bypasses all potential authentication conflicts</li>
                <li>• 🧪 Only deploy index.ts (ignore KV store for this test)</li>
              </ul>
            </div>

            <div className="space-y-4">
              {/* Only Index.ts File for minimal test */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <FileText className="w-4 h-4" />
                  <span>🧪 MINIMAL index.ts (Deploy this ONLY)</span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => selectCode('index')}
                    className={
                      selectedIndex 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-purple-500 hover:bg-purple-600 text-white'
                    }
                    size="sm"
                  >
                    {selectedIndex ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Selected!
                      </>
                    ) : (
                      <>
                        <MousePointer className="w-3 h-3 mr-1" />
                        Select All
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => copyCode('index')}
                    className={
                      copiedIndex 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }
                    size="sm"
                  >
                    {copiedIndex ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <textarea
                  ref={indexTextareaRef}
                  className="w-full h-80 p-3 text-xs font-mono border-2 border-red-300 rounded-lg bg-red-50 resize-none"
                  value={indexCode}
                  readOnly
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                🧪 <strong>DIAGNOSTIC TEST:</strong> This ultra-minimal version has NO imports, NO authentication logic, and NO dependencies. 
                If this still returns 401 errors, the issue is at the Supabase Edge Functions configuration level, not in our code.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}