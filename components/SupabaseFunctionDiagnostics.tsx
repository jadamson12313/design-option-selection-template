import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Settings, 
  Shield,
  Info,
  Copy,
  RefreshCw,
  Bug
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function SupabaseFunctionDiagnostics() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setTestResults(null);

    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Basic function accessibility
    try {
      const response = await fetch('https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      results.tests.push({
        name: 'Function Accessibility Test',
        status: response.ok ? 'pass' : 'fail',
        statusCode: response.status,
        statusText: response.statusText,
        details: `Response: ${response.status} ${response.statusText}`,
        critical: true
      });

      if (response.status === 401) {
        results.tests.push({
          name: '401 Error Analysis',
          status: 'fail',
          details: 'Function returning 401 even with minimal code - indicates Supabase project-level auth enforcement',
          recommendation: 'Check Supabase project authentication settings',
          critical: true
        });
      }

    } catch (error) {
      results.tests.push({
        name: 'Function Accessibility Test',
        status: 'error',
        details: `Network error: ${error.message}`,
        critical: true
      });
    }

    // Test 2: CORS preflight
    try {
      const response = await fetch('https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173/health', {
        method: 'OPTIONS'
      });
      
      results.tests.push({
        name: 'CORS Preflight Test',
        status: response.ok ? 'pass' : 'fail',
        statusCode: response.status,
        details: `OPTIONS request: ${response.status} ${response.statusText}`,
        critical: false
      });

    } catch (error) {
      results.tests.push({
        name: 'CORS Preflight Test',
        status: 'error',
        details: `CORS error: ${error.message}`,
        critical: false
      });
    }

    // Test 3: Root function endpoint
    try {
      const response = await fetch('https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173', {
        method: 'GET'
      });
      
      results.tests.push({
        name: 'Root Endpoint Test',
        status: response.ok ? 'pass' : 'fail',
        statusCode: response.status,
        details: `Root endpoint: ${response.status} ${response.statusText}`,
        critical: false
      });

    } catch (error) {
      results.tests.push({
        name: 'Root Endpoint Test',
        status: 'error',
        details: `Root error: ${error.message}`,
        critical: false
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const copyDiagnostics = () => {
    if (testResults) {
      const diagnosticText = `Supabase Function Diagnostics Report
Generated: ${testResults.timestamp}

${testResults.tests.map(test => `
${test.name}: ${test.status.toUpperCase()}
Status Code: ${test.statusCode || 'N/A'}
Details: ${test.details}
${test.recommendation ? `Recommendation: ${test.recommendation}` : ''}
`).join('\n')}

Project URL: https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173
Function Name: make-server-0b7c7173
Issue: Persistent 401 errors even with minimal code (no auth logic)
`;

      navigator.clipboard.writeText(diagnosticText);
      toast.success('Diagnostics copied to clipboard!');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Supabase Function Diagnostics
          <Badge variant="destructive">Critical Issue</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>CONFIRMED:</strong> 401 errors persist even with ultra-minimal code (no imports, no auth). 
            This indicates a Supabase project-level authentication enforcement issue.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>

          {testResults && (
            <Button onClick={copyDiagnostics} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copy Report
            </Button>
          )}
        </div>

        {testResults && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Report generated: {new Date(testResults.timestamp).toLocaleString()}
            </div>
            
            {testResults.tests.map((test, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {test.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {test.status === 'fail' && <XCircle className="w-4 h-4 text-red-500" />}
                  {test.status === 'error' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  
                  <span className="font-medium">{test.name}</span>
                  
                  {test.critical && <Badge variant="destructive" className="text-xs">Critical</Badge>}
                  
                  {test.statusCode && (
                    <Badge variant={test.statusCode === 200 ? "default" : "destructive"}>
                      {test.statusCode}
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">{test.details}</div>
                
                {test.recommendation && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <strong>Recommendation:</strong> {test.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Potential Supabase Configuration Issues
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Auth Settings
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Project may have global auth enforcement</li>
                <li>• Edge Functions might require authentication</li>
                <li>• RLS policies could be affecting functions</li>
              </ul>
            </div>

            <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Function Settings
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Function permissions may be restricted</li>
                <li>• Execution environment settings</li>
                <li>• JWT verification enforcement</li>
              </ul>
            </div>
          </div>

          <Alert className="border-orange-200 bg-orange-50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> Check your Supabase project dashboard settings:
              <div className="mt-2">
                <a 
                  href="https://supabase.com/dashboard/project/btnehreatcbzlglrrpqv/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-orange-700 underline hover:text-orange-800"
                >
                  API Settings <ExternalLink className="w-3 h-3" />
                </a>
                {" | "}
                <a 
                  href="https://supabase.com/dashboard/project/btnehreatcbzlglrrpqv/auth/settings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-orange-700 underline hover:text-orange-800"
                >
                  Auth Settings <ExternalLink className="w-3 h-3" />
                </a>
                {" | "}
                <a 
                  href="https://supabase.com/dashboard/project/btnehreatcbzlglrrpqv/functions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-orange-700 underline hover:text-orange-800"
                >
                  Functions <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Checklist for Supabase Dashboard:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 border border-gray-400 rounded mt-0.5"></div>
                <span>Check if "Require authentication for all Edge Functions" is enabled</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 border border-gray-400 rounded mt-0.5"></div>
                <span>Verify function execution permissions</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 border border-gray-400 rounded mt-0.5"></div>
                <span>Check RLS policies on system tables</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 border border-gray-400 rounded mt-0.5"></div>
                <span>Review API key restrictions</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}