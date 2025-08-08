import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, Terminal, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticTest {
  name: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  message: string;
  details?: string;
  response?: any;
}

export function ServerDeploymentDiagnostics() {
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { name: 'Edge Function Existence', status: 'pending', message: '' },
    { name: 'Server Deployment Status', status: 'pending', message: '' },
    { name: 'Health Endpoint Access', status: 'pending', message: '' },
    { name: 'CORS Configuration', status: 'pending', message: '' },
    { name: 'Environment Variables', status: 'pending', message: '' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [deploymentNeeded, setDeploymentNeeded] = useState(false);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  const updateTest = (index: number, updates: Partial<DiagnosticTest>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDeploymentNeeded(false);

    try {
      // Test 1: Check if Edge Function exists (try various endpoints)
      updateTest(0, { status: 'checking', message: 'Checking if Edge Function is deployed...' });
      
      const endpoints = [
        `${baseUrl}/make-server-0b7c7173/health`,
        `${baseUrl}/make-server-0b7c7173/debug`,
        `${baseUrl}/server-deployment/health`,
        `${baseUrl}/health`
      ];

      let functionExists = false;
      let workingEndpoint = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { method: 'GET' });
          if (response.status !== 404) {
            functionExists = true;
            workingEndpoint = endpoint;
            break;
          }
        } catch (error) {
          lastError = (error as Error).message;
        }
      }

      if (functionExists) {
        updateTest(0, {
          status: 'passed',
          message: 'Edge Function is deployed',
          details: `Working endpoint: ${workingEndpoint}`
        });
      } else {
        updateTest(0, {
          status: 'failed',
          message: 'Edge Function not found',
          details: `Tried ${endpoints.length} endpoints, all returned 404`
        });
        setDeploymentNeeded(true);
      }

      // Test 2: Server deployment status
      updateTest(1, { status: 'checking', message: 'Testing server response...' });
      
      if (functionExists && workingEndpoint) {
        try {
          const response = await fetch(workingEndpoint);
          const data = await response.json();
          
          updateTest(1, {
            status: response.ok ? 'passed' : 'failed',
            message: response.ok ? 'Server is responding correctly' : `Server error: ${response.status}`,
            details: `Response: ${JSON.stringify(data, null, 2)}`,
            response: data
          });
        } catch (error) {
          updateTest(1, {
            status: 'failed',
            message: 'Server not responding properly',
            details: (error as Error).message
          });
        }
      } else {
        updateTest(1, {
          status: 'failed',
          message: 'Cannot test - Edge Function not deployed'
        });
      }

      // Test 3: Health endpoint specific test
      updateTest(2, { status: 'checking', message: 'Testing health endpoint...' });
      
      if (functionExists) {
        try {
          const healthResponse = await fetch(`${baseUrl}/make-server-0b7c7173/health`);
          
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            updateTest(2, {
              status: 'passed',
              message: 'Health endpoint working',
              details: `Features: ${healthData.features ? healthData.features.join(', ') : 'None listed'}`,
              response: healthData
            });
          } else {
            updateTest(2, {
              status: 'failed',
              message: `Health endpoint error: ${healthResponse.status}`,
              details: await healthResponse.text()
            });
          }
        } catch (error) {
          updateTest(2, {
            status: 'failed',
            message: 'Health endpoint not accessible',
            details: (error as Error).message
          });
        }
      } else {
        updateTest(2, {
          status: 'failed',
          message: 'Cannot test - Edge Function not deployed'
        });
      }

      // Test 4: CORS configuration
      updateTest(3, { status: 'checking', message: 'Testing CORS configuration...' });
      
      if (functionExists) {
        try {
          const corsResponse = await fetch(`${baseUrl}/make-server-0b7c7173/health`, {
            method: 'OPTIONS'
          });
          
          const corsHeaders = {
            'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
          };

          updateTest(3, {
            status: corsHeaders['Access-Control-Allow-Origin'] ? 'passed' : 'failed',
            message: corsHeaders['Access-Control-Allow-Origin'] ? 'CORS properly configured' : 'CORS configuration missing',
            details: JSON.stringify(corsHeaders, null, 2)
          });
        } catch (error) {
          updateTest(3, {
            status: 'failed',
            message: 'CORS test failed',
            details: (error as Error).message
          });
        }
      } else {
        updateTest(3, {
          status: 'failed',
          message: 'Cannot test - Edge Function not deployed'
        });
      }

      // Test 5: Environment variables (via debug endpoint)
      updateTest(4, { status: 'checking', message: 'Testing environment configuration...' });
      
      if (functionExists) {
        try {
          const debugResponse = await fetch(`${baseUrl}/make-server-0b7c7173/debug`);
          
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            const hasEnvVars = debugData.environment?.supabaseUrl && debugData.environment?.supabaseServiceKey;
            
            updateTest(4, {
              status: hasEnvVars ? 'passed' : 'failed',
              message: hasEnvVars ? 'Environment variables configured' : 'Environment variables missing',
              details: JSON.stringify(debugData.environment, null, 2),
              response: debugData
            });
          } else {
            updateTest(4, {
              status: 'failed',
              message: 'Debug endpoint not available',
              details: `Status: ${debugResponse.status}`
            });
          }
        } catch (error) {
          updateTest(4, {
            status: 'failed',
            message: 'Environment test failed',
            details: (error as Error).message
          });
        }
      } else {
        updateTest(4, {
          status: 'failed',
          message: 'Cannot test - Edge Function not deployed'
        });
      }

    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'checking': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <div className="w-4 h-4 border border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'checking': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const passedTests = tests.filter(test => test.status === 'passed').length;
  const failedTests = tests.filter(test => test.status === 'failed').length;

  const deployCommands = [
    'npm install -g supabase',
    'supabase login',
    `supabase link --project-ref ${projectId}`,
    'supabase functions deploy make-server-0b7c7173'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Server Deployment Diagnostics
        </CardTitle>
        <CardDescription>
          Comprehensive diagnosis of your server deployment status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={runDiagnostics}
            disabled={isRunning}
            className="bg-[#F38746] hover:bg-[#e67632]"
          >
            {isRunning ? '🔄 Running Diagnostics...' : '🚀 Run Full Diagnostics'}
          </Button>
          
          {(passedTests > 0 || failedTests > 0) && (
            <div className="flex gap-2">
              <Badge variant="default" className="bg-green-600">
                ✅ {passedTests} Passed
              </Badge>
              {failedTests > 0 && (
                <Badge variant="destructive">
                  ❌ {failedTests} Failed
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Diagnostic Results */}
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{test.name}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        test.status === 'passed' ? 'border-green-500 text-green-700' :
                        test.status === 'failed' ? 'border-red-500 text-red-700' :
                        test.status === 'checking' ? 'border-blue-500 text-blue-700' :
                        'border-gray-500 text-gray-700'
                      }`}
                    >
                      {test.status.toUpperCase()}
                    </Badge>
                  </div>
                  {test.message && (
                    <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                  )}
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        Show Details
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {test.details}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deployment Instructions */}
        {deploymentNeeded && (
          <div className="border-l-4 border-red-500 pl-4 py-3 bg-red-50">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-red-800 mb-2">❌ Edge Function Not Deployed</h4>
                <p className="text-red-700 text-sm mb-3">
                  Your server code exists but the Edge Function isn't deployed to Supabase. Deploy it using these commands:
                </p>
                
                <div className="space-y-2">
                  {deployCommands.map((command, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded font-mono text-sm">
                      <span className="flex-1">{command}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(command, `deploy-${index}`)}
                      >
                        {copySuccess === `deploy-${index}` ? '✅' : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
                    className="text-red-700 border-red-300"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Supabase Functions Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {passedTests === tests.length && passedTests > 0 && (
          <div className="border-l-4 border-green-500 pl-4 py-3 bg-green-50">
            <h4 className="text-green-800 mb-1">🎉 Server Fully Deployed and Working!</h4>
            <p className="text-green-700 text-sm">
              All diagnostics passed. Your server is deployed and accessible with proper configuration.
            </p>
          </div>
        )}

        {/* Quick Links */}
        <div className="border-t pt-4">
          <h4 className="text-sm mb-2">🔗 Quick Links</h4>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${baseUrl}/make-server-0b7c7173/health`, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Test Health
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${baseUrl}/make-server-0b7c7173/debug`, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Debug Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Supabase Dashboard
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}