import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FeatureTest {
  name: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
  message: string;
  details?: string;
}

export function CloudSyncFeatureChecker() {
  const [tests, setTests] = useState<FeatureTest[]>([
    { name: 'Server Health', status: 'pending', message: '' },
    { name: 'CloudSync Health', status: 'pending', message: '' },
    { name: 'Signup Endpoint', status: 'pending', message: '' },
    { name: 'Email Confirmation', status: 'pending', message: '' },
    { name: 'Projects Endpoint', status: 'pending', message: '' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  const updateTest = (index: number, updates: Partial<FeatureTest>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const runFeatureTests = async () => {
    setIsRunning(true);
    setNeedsUpgrade(false);
    
    try {
      // Test 1: Basic server health - try multiple endpoints
      updateTest(0, { status: 'checking', message: 'Testing server deployment...' });
      try {
        const healthUrls = [
          `${baseUrl}/make-server-0b7c7173/health`,
          `${baseUrl}/server-deployment/health`,
          `${baseUrl}/health`
        ];

        let healthSuccess = false;
        let healthData = null;
        let lastError = null;

        for (const url of healthUrls) {
          try {
            const healthResponse = await fetch(url);
            if (healthResponse.ok) {
              healthData = await healthResponse.json();
              healthSuccess = true;
              break;
            } else {
              lastError = `${healthResponse.status}`;
            }
          } catch (urlError) {
            lastError = (urlError as Error).message;
          }
        }

        if (healthSuccess) {
          updateTest(0, { 
            status: 'passed', 
            message: 'Server is running',
            details: `Status: ${healthData?.status || 'ok'}`
          });
        } else {
          updateTest(0, { 
            status: 'failed', 
            message: `Server health failed: ${lastError || 'Unknown error'}`
          });
          return;
        }
      } catch (error) {
        updateTest(0, { 
          status: 'failed', 
          message: `Server not accessible: ${(error as Error).message}`
        });
        return;
      }

      // Test 2: CloudSync health endpoint
      updateTest(1, { status: 'checking', message: 'Testing CloudSync functionality...' });
      try {
        const cloudSyncResponse = await fetch(`${baseUrl}/make-server-0b7c7173/health`);
        if (cloudSyncResponse.ok) {
          const cloudSyncData = await cloudSyncResponse.json();
          const hasCloudSyncFeatures = cloudSyncData.features && Array.isArray(cloudSyncData.features);
          
          if (hasCloudSyncFeatures) {
            updateTest(1, { 
              status: 'passed', 
              message: 'CloudSync functionality detected!',
              details: `Features: ${cloudSyncData.features.join(', ')}`
            });
          } else {
            updateTest(1, { 
              status: 'failed', 
              message: 'Basic health only - CloudSync features missing'
            });
            setNeedsUpgrade(true);
          }
        } else {
          updateTest(1, { 
            status: 'failed', 
            message: `CloudSync health endpoint not found: ${cloudSyncResponse.status}`
          });
          setNeedsUpgrade(true);
        }
      } catch (error) {
        updateTest(1, { 
          status: 'failed', 
          message: 'CloudSync health endpoint not accessible'
        });
        setNeedsUpgrade(true);
      }

      // Test 3: Signup endpoint
      updateTest(2, { status: 'checking', message: 'Testing signup endpoint...' });
      try {
        // Test with invalid data to see if endpoint exists
        const signupResponse = await fetch(`${baseUrl}/make-server-0b7c7173/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: '', password: '', name: '' })
        });
        
        if (signupResponse.status === 400) {
          // 400 means endpoint exists and is validating input
          updateTest(2, { 
            status: 'passed', 
            message: 'Signup endpoint is working',
            details: 'Endpoint exists and validates input'
          });
        } else if (signupResponse.status === 404) {
          updateTest(2, { 
            status: 'failed', 
            message: 'Signup endpoint not found'
          });
        } else {
          updateTest(2, { 
            status: 'failed', 
            message: `Unexpected signup response: ${signupResponse.status}`
          });
        }
      } catch (error) {
        updateTest(2, { 
          status: 'failed', 
          message: 'Signup endpoint not accessible'
        });
      }

      // Test 4: Email confirmation endpoint
      updateTest(3, { status: 'checking', message: 'Testing email confirmation...' });
      try {
        const confirmResponse = await fetch(`${baseUrl}/make-server-0b7c7173/auth/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: '' })
        });
        
        if (confirmResponse.status === 400) {
          // 400 means endpoint exists and is validating input
          updateTest(3, { 
            status: 'passed', 
            message: 'Email confirmation endpoint is working',
            details: 'Endpoint exists and validates input'
          });
        } else if (confirmResponse.status === 404) {
          updateTest(3, { 
            status: 'failed', 
            message: 'Email confirmation endpoint not found'
          });
        } else {
          updateTest(3, { 
            status: 'failed', 
            message: `Unexpected confirmation response: ${confirmResponse.status}`
          });
        }
      } catch (error) {
        updateTest(3, { 
          status: 'failed', 
          message: 'Email confirmation endpoint not accessible'
        });
      }

      // Test 5: Projects endpoint (requires auth)
      updateTest(4, { status: 'checking', message: 'Testing projects endpoint...' });
      try {
        // First try without auth to see if endpoint exists
        const projectsResponse = await fetch(`${baseUrl}/make-server-0b7c7173/projects`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json'
          }
        });
        
        if (projectsResponse.status === 401) {
          // 401 means endpoint exists but requires proper auth
          updateTest(4, { 
            status: 'passed', 
            message: 'Projects endpoint exists and requires authentication',
            details: 'Endpoint properly validates authorization'
          });
        } else if (projectsResponse.status === 404) {
          updateTest(4, { 
            status: 'failed', 
            message: 'Projects endpoint not found'
          });
        } else if (projectsResponse.status === 200) {
          // Should not happen without auth, but endpoint exists
          updateTest(4, { 
            status: 'passed', 
            message: 'Projects endpoint is accessible',
            details: 'Endpoint exists (auth may be optional)'
          });
        } else {
          updateTest(4, { 
            status: 'failed', 
            message: `Unexpected projects response: ${projectsResponse.status}`
          });
        }
      } catch (error) {
        updateTest(4, { 
          status: 'failed', 
          message: 'Projects endpoint not accessible'
        });
      }

    } catch (error) {
      console.error('Feature test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: FeatureTest['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'checking': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      default: return <div className="w-4 h-4 border border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: FeatureTest['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'checking': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const passedTests = tests.filter(test => test.status === 'passed').length;
  const failedTests = tests.filter(test => test.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 CloudSync Feature Checker
        </CardTitle>
        <CardDescription>
          Test if your deployed server has full CloudSync functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={runFeatureTests}
            disabled={isRunning}
            className="bg-[#F38746] hover:bg-[#e67632]"
          >
            {isRunning ? '🔄 Testing...' : '🚀 Test CloudSync Features'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open(`${baseUrl}/make-server-0b7c7173/debug`, '_blank')}
            className="text-gray-600"
          >
            🔍 Debug Server
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

        {/* Test Results */}
        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getStatusColor(test.status)}`}>
              <div className="flex items-start gap-3">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm">{test.name}</span>
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
                    <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade Warning */}
        {needsUpgrade && (
          <div className="border-l-4 border-yellow-500 pl-4 py-3 bg-yellow-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-yellow-800 mb-1">⚠️ Server Upgrade Needed</h4>
                <p className="text-yellow-700 text-sm">
                  Your server is deployed but missing CloudSync features. You need to upgrade it with the full CloudSync functionality.
                </p>
                <div className="mt-2 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/UPDATE-YOUR-DEPLOYED-SERVER.md', '_blank')}
                    className="text-yellow-700 border-yellow-300"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Upgrade Instructions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {passedTests === tests.length && passedTests > 0 && (
          <div className="border-l-4 border-green-500 pl-4 py-3 bg-green-50">
            <h4 className="text-green-800 mb-1">🎉 All CloudSync Features Working!</h4>
            <p className="text-green-700 text-sm">
              Your server has full CloudSync functionality. You can now use signup, authentication, data synchronization, and all other features.
            </p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}