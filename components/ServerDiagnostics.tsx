import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  details?: any;
}

export function ServerDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const log = (message: string, type: DiagnosticResult['type'] = 'info', details?: any) => {
    const result: DiagnosticResult = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      message,
      type,
      details
    };
    setResults(prev => [...prev, result]);
  };

  const runServerDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      log('🔍 Starting Server Diagnostics', 'info');
      log('='.repeat(60), 'info');

      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173`;
      
      log(`📡 Testing server at: ${baseUrl}`, 'info');
      log(`📋 Project ID: ${projectId}`, 'info');
      log(`🔑 Public Key: ${publicAnonKey.substring(0, 20)}...`, 'info');

      // Test 1: Basic connectivity
      log('🔄 Test 1: Basic connectivity to edge functions domain...', 'info');
      try {
        const testResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        log(`   Response status: ${testResponse.status}`, testResponse.ok ? 'success' : 'warning');
        log(`   Response headers:`, 'info', Object.fromEntries(testResponse.headers.entries()));
        
        if (testResponse.ok) {
          try {
            const data = await testResponse.text();
            log(`   Response body: ${data.substring(0, 200)}...`, 'info');
          } catch (parseError) {
            log(`   Could not parse response body`, 'warning');
          }
        }
      } catch (connectError) {
        log(`❌ Basic connectivity failed: ${connectError}`, 'error');
        return;
      }

      // Test 2: Health endpoint with different methods
      log('🔄 Test 2: Health endpoint tests...', 'info');
      
      const healthUrls = [
        `${baseUrl}/health`,
        `${baseUrl}/health/`,
        `https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173/health`
      ];

      for (const url of healthUrls) {
        try {
          log(`   Testing: ${url}`, 'info');
          
          const healthResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            }
          });
          
          log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`, 
              healthResponse.ok ? 'success' : 'error');
          
          const responseHeaders = Object.fromEntries(healthResponse.headers.entries());
          log(`   Headers:`, 'info', responseHeaders);
          
          if (healthResponse.status !== 404) {
            try {
              const responseText = await healthResponse.text();
              log(`   Response: ${responseText}`, healthResponse.ok ? 'success' : 'warning');
              
              if (healthResponse.ok) {
                try {
                  const healthData = JSON.parse(responseText);
                  log(`✅ Health check successful!`, 'success', healthData);
                  break;
                } catch (jsonError) {
                  log(`   Valid response but not JSON`, 'warning');
                }
              }
            } catch (textError) {
              log(`   Could not read response body: ${textError}`, 'warning');
            }
          }
        } catch (healthError) {
          log(`   Health check error: ${healthError}`, 'error');
        }
      }

      // Test 3: Test with no auth header
      log('🔄 Test 3: Health endpoint without auth header...', 'info');
      try {
        const noAuthResponse = await fetch(`${baseUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        log(`   No auth status: ${noAuthResponse.status}`, 
            noAuthResponse.ok ? 'success' : 'warning');
        
        if (!noAuthResponse.ok) {
          const errorText = await noAuthResponse.text();
          log(`   No auth error: ${errorText}`, 'error');
        }
      } catch (noAuthError) {
        log(`   No auth test failed: ${noAuthError}`, 'error');
      }

      // Test 4: Test with OPTIONS preflight
      log('🔄 Test 4: CORS preflight test...', 'info');
      try {
        const optionsResponse = await fetch(`${baseUrl}/health`, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });
        
        log(`   OPTIONS status: ${optionsResponse.status}`, 
            optionsResponse.ok ? 'success' : 'warning');
        
        const corsHeaders = Object.fromEntries(optionsResponse.headers.entries());
        log(`   CORS headers:`, 'info', corsHeaders);
      } catch (optionsError) {
        log(`   CORS test failed: ${optionsError}`, 'error');
      }

      // Test 5: Test server deployment status
      log('🔄 Test 5: Checking Supabase Edge Functions status...', 'info');
      try {
        const statusResponse = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
          method: 'HEAD',
          headers: { 'apikey': publicAnonKey }
        });
        
        log(`   Supabase REST API status: ${statusResponse.status}`, 
            statusResponse.ok ? 'success' : 'warning');
      } catch (statusError) {
        log(`   Supabase status check failed: ${statusError}`, 'warning');
      }

      // Test 6: Test different signup endpoints to see if server is responding at all
      log('🔄 Test 6: Testing if server responds to any endpoint...', 'info');
      const testEndpoints = [
        '/health',
        '/auth/signup',
        '/signup',
        '/',
        '/status'
      ];

      for (const endpoint of testEndpoints) {
        try {
          const testUrl = `${baseUrl}${endpoint}`;
          const testResponse = await fetch(testUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (testResponse.status !== 404) {
            log(`   ${endpoint}: ${testResponse.status} (Server responding!)`, 
                testResponse.ok ? 'success' : 'warning');
          }
        } catch (endpointError) {
          log(`   ${endpoint}: Network error`, 'warning');
        }
      }

      log('🏁 Server diagnostics complete', 'info');
      log('='.repeat(60), 'info');

    } catch (error) {
      log(`💥 Diagnostics crashed: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getTypeColor = (type: DiagnosticResult['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: DiagnosticResult['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Server Connection Diagnostics
        </CardTitle>
        <CardDescription>
          Deep diagnostic tests to identify server deployment and connectivity issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runServerDiagnostics} 
            disabled={isRunning}
            className="bg-[#F38746] hover:bg-[#e67632]"
          >
            {isRunning ? '🔄 Running...' : '🚀 Run Server Diagnostics'}
          </Button>
          <Button 
            variant="outline" 
            onClick={clearResults}
            disabled={isRunning}
          >
            🧹 Clear
          </Button>
        </div>

        <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-50">
          <div className="space-y-2 font-mono text-sm">
            {results.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Click "Run Server Diagnostics" to test server connectivity...
              </div>
            ) : (
              results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded border ${getTypeColor(result.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 min-w-fit">
                      [{result.timestamp}]
                    </span>
                    <span>{getTypeIcon(result.type)}</span>
                    <div className="flex-1">
                      <span className="whitespace-pre-wrap">{result.message}</span>
                      {result.details && (
                        <pre className="text-xs mt-1 opacity-75 overflow-auto max-h-20">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="text-xs text-gray-500">
          <p><strong>What this diagnostic tests:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Basic connectivity to Supabase Edge Functions</li>
            <li>Health endpoint accessibility with different URLs</li>
            <li>Authentication header requirements</li>
            <li>CORS configuration</li>
            <li>Server deployment status</li>
            <li>Alternative endpoint responses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}