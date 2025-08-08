import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CopyCodeButton } from './CopyCodeButton';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  TestTube, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Globe,
  Rocket,
  Target,
  Activity
} from 'lucide-react';

export function NuclearTestButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);

  const generateCurlCommand = (endpoint: string = 'health') => {
    const baseUrl = projectId 
      ? `https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173/${endpoint}`
      : `https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-0b7c7173/${endpoint}`;
    
    if (endpoint === 'health') {
      return `curl "${baseUrl}"`;
    } else if (endpoint === 'api/test') {
      return `curl "${baseUrl}"`;
    } else if (endpoint === 'api/kv/test') {
      return `curl -X POST "${baseUrl}" -H "Content-Type: application/json" -d '{"key": "test", "value": "nuclear-working"}'`;
    }
    return `curl "${baseUrl}"`;
  };

  const openHtmlTest = () => {
    const url = projectId 
      ? `/quick-nuclear-test.html?projectId=${projectId}`
      : '/quick-nuclear-test.html';
    window.open(url, '_blank');
  };

  const runLiveTest = async (endpoint: string = 'health') => {
    if (!projectId.trim()) {
      alert('Please enter your Supabase Project ID first');
      return;
    }

    setIsRunningTest(true);
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173/${endpoint}`;
    
    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      const data = await response.json();
      
      const result = {
        endpoint,
        url,
        status: response.status,
        statusText: response.statusText,
        data,
        responseTime: endTime - startTime,
        timestamp: new Date().toLocaleTimeString(),
        success: response.status === 200
      };
      
      setTestResults(prev => [result, ...prev]);
    } catch (error) {
      const result = {
        endpoint,
        url,
        status: 0,
        statusText: 'Network Error',
        data: { error: (error as Error).message },
        responseTime: 0,
        timestamp: new Date().toLocaleTimeString(),
        success: false
      };
      
      setTestResults(prev => [result, ...prev]);
    } finally {
      setIsRunningTest(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold"
        >
          <TestTube className="w-4 h-4 mr-1" />
          🧪 Test Nuclear
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="w-6 h-6 text-blue-600" />
            Nuclear Option Testing Suite
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
              Verify Deployment
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project ID Input */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Label htmlFor="projectId" className="text-blue-800 font-semibold">
              Supabase Project ID
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="Enter your project ID (e.g., abcdefghijklmnop)"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProjectId('')}
                className="text-gray-500"
              >
                Clear
              </Button>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Find this in your Supabase dashboard URL: https://supabase.com/dashboard/project/<strong>YOUR_PROJECT_ID</strong>
            </p>
          </div>

          {/* Quick Test Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Command Line Testing */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Command Line Test
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700">Health Check Command:</Label>
                  <div className="bg-gray-900 text-gray-100 p-2 rounded text-sm font-mono mt-1">
                    {generateCurlCommand('health')}
                  </div>
                  <CopyCodeButton 
                    code={generateCurlCommand('health')}
                    filename="nuclear-health-test"
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700">API Test Command:</Label>
                  <div className="bg-gray-900 text-gray-100 p-2 rounded text-sm font-mono mt-1">
                    {generateCurlCommand('api/test')}
                  </div>
                  <CopyCodeButton 
                    code={generateCurlCommand('api/test')}
                    filename="nuclear-api-test"
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700">KV Store Test Command:</Label>
                  <div className="bg-gray-900 text-gray-100 p-2 rounded text-sm font-mono mt-1">
                    {generateCurlCommand('api/kv/test')}
                  </div>
                  <CopyCodeButton 
                    code={generateCurlCommand('api/kv/test')}
                    filename="nuclear-kv-test"
                    className="w-full mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Visual Browser Testing */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Visual Browser Test
              </h3>
              
              <p className="text-sm text-green-700 mb-4">
                Launch the interactive nuclear test interface in your browser with visual feedback and automated testing.
              </p>
              
              <Button
                onClick={openHtmlTest}
                className="w-full bg-green-600 hover:bg-green-700 text-white mb-3"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Visual Test Interface
              </Button>
              
              <div className="text-xs text-green-600">
                This opens <code>/quick-nuclear-test.html</code> with your project ID pre-filled
              </div>
            </div>
          </div>

          {/* Live Testing */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Live Testing (Run Tests Now)
            </h3>
            
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => runLiveTest('health')}
                disabled={isRunningTest || !projectId.trim()}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {isRunningTest ? 'Testing...' : 'Test Health'}
              </Button>
              <Button
                onClick={() => runLiveTest('api/test')}
                disabled={isRunningTest || !projectId.trim()}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {isRunningTest ? 'Testing...' : 'Test API'}
              </Button>
              <Button
                onClick={() => runLiveTest('api/kv/test')}
                disabled={isRunningTest || !projectId.trim()}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {isRunningTest ? 'Testing...' : 'Test KV'}
              </Button>
              {testResults.length > 0 && (
                <Button
                  onClick={clearResults}
                  variant="outline"
                  size="sm"
                  className="text-gray-500"
                >
                  Clear Results
                </Button>
              )}
            </div>

            {/* Live Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <Label className="text-sm text-purple-700">Live Test Results:</Label>
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border ${
                      result.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        {result.endpoint} - {result.timestamp}
                      </span>
                      <Badge 
                        variant={result.success ? "default" : "destructive"}
                        className={result.success ? 'bg-green-100 text-green-800' : ''}
                      >
                        {result.status} {result.statusText}
                      </Badge>
                    </div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                    {result.responseTime > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Response time: {result.responseTime}ms
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Success Indicators */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              What to Look For - SUCCESS Indicators
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">✅ HTTP Response</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• <strong>Status Code:</strong> 200 (not 401!)</li>
                  <li>• <strong>Response Time:</strong> Under 2000ms</li>
                  <li>• <strong>No auth errors:</strong> Clean response</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-700 mb-2">✅ JSON Content</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  <li>• <strong>"nuclearMode":</strong> true</li>
                  <li>• <strong>"authStatus":</strong> "completely-disabled"</li>
                  <li>• <strong>"success":</strong> true</li>
                  <li>• <strong>"status":</strong> "ok"</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-100 rounded border border-green-300">
              <Label className="text-green-800 font-semibold">Perfect Success Response:</Label>
              <pre className="text-xs text-green-700 mt-1 font-mono">
{`{
  "success": true,
  "nuclearMode": true,
  "authStatus": "completely-disabled",
  "status": "ok",
  "health": "healthy"
}`}
              </pre>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Still Getting 401? Troubleshooting
            </h3>
            
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>⏳ Wait Time:</strong> Nuclear deployment needs 30-60 seconds to propagate</p>
              <p><strong>🔍 Verify Project ID:</strong> Double-check your project ID is correct</p>
              <p><strong>📍 Check URL:</strong> Ensure you're using the exact function name <code>make-server-0b7c7173</code></p>
              <p><strong>🔄 Redeploy:</strong> If still failing, try redeploying with the Nuclear Deploy button</p>
              <p><strong>📊 Check Logs:</strong> Run <code>supabase functions logs make-server-0b7c7173</code></p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-4 border-t">
            <Button
              onClick={openHtmlTest}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Globe className="w-4 h-4 mr-2" />
              Open Visual Test
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}