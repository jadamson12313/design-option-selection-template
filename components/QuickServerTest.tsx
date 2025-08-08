import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface TestResult {
  url: string;
  status: number;
  success: boolean;
  responseTime: number;
  response?: any;
  error?: string;
}

export function QuickServerTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const testEndpoints = async () => {
    setTesting(true);
    setResults([]);

    const endpoints = [
      'https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173/health',
      'https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173/debug',
      'https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/make-server-0b7c7173',
      'https://btnehreatcbzlglrrpqv.supabase.co/functions/v1/server/health',
    ];

    const testResults: TestResult[] = [];

    for (const url of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmVocmVhdGNiemdMZ2xycnBxdiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMzODYzMDE1LCJleHAiOjIwNDk0MzkwMTV9.PUZ7BkNDUt7-vqAcRiNqDwOGD4DQE4e3Qmmi6SqDINY'
          }
        });
        const endTime = Date.now();

        let responseData;
        try {
          const text = await response.text();
          responseData = JSON.parse(text);
        } catch {
          responseData = 'Non-JSON response';
        }

        testResults.push({
          url,
          status: response.status,
          success: response.ok,
          responseTime: endTime - startTime,
          response: responseData
        });
      } catch (error) {
        testResults.push({
          url,
          status: 0,
          success: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      setResults([...testResults]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (result.status === 404) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (result: TestResult) => {
    if (result.success) return <Badge variant="secondary" className="bg-green-100 text-green-800">✅ {result.status}</Badge>;
    if (result.status === 404) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⚠️ {result.status}</Badge>;
    return <Badge variant="destructive">❌ {result.error ? 'ERROR' : result.status}</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Quick Server Deployment Test
          <Button
            onClick={testEndpoints}
            disabled={testing}
            size="sm"
            className="ml-auto"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              '🚀 Run Tests'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will test if your Supabase function is deployed and responding correctly.
          </AlertDescription>
        </Alert>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(result)}
                      <span className="font-mono text-sm break-all">{result.url}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(result)}
                      {result.responseTime > 0 && (
                        <Badge variant="outline">{result.responseTime}ms</Badge>
                      )}
                    </div>
                    {result.error && (
                      <Alert className="mt-2">
                        <AlertDescription className="text-red-700">
                          <strong>Error:</strong> {result.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    {result.response && typeof result.response === 'object' && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600">View Response</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && !testing && (
          <Alert>
            <AlertDescription>
              Click "Run Tests" to check if your server function is properly deployed and accessible.
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">🔧 Next Steps Based on Results:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <strong>✅ If any endpoint returns 200:</strong> Your function is deployed but may have routing issues
            </div>
            <div>
              <strong>⚠️ If all return 404:</strong> Function may not be deployed or has wrong name
            </div>
            <div>
              <strong>❌ If network errors:</strong> Check your internet connection and Supabase status
            </div>
          </div>
          
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard/project/btnehreatcbzlglrrpqv/functions', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Functions Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/diagnose-404-issue.html', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Full Diagnostics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/fixed-deployment.html', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Redeploy Guide
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}