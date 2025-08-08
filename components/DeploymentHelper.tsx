import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Copy, Terminal } from 'lucide-react';

export function DeploymentHelper() {
  const [deploymentStatus, setDeploymentStatus] = useState<'unknown' | 'checking' | 'deployed' | 'not-deployed'>('unknown');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const projectId = 'btnehreatcbzlglrrpqv';
  const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

  const checkDeployment = async () => {
    setDeploymentStatus('checking');
    
    try {
      // Test if the edge function is deployed - try both old and new routes
      const healthUrls = [
        `${baseUrl}/make-server-0b7c7173/health`,
        `${baseUrl}/server-deployment/health`,
        `${baseUrl}/health`
      ];

      let deployed = false;
      for (const url of healthUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            console.log('Health check response:', data);
            deployed = true;
            break;
          }
        } catch (urlError) {
          console.log(`Failed to reach ${url}:`, urlError);
        }
      }
      
      setDeploymentStatus(deployed ? 'deployed' : 'not-deployed');
    } catch (error) {
      setDeploymentStatus('not-deployed');
    }
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
          🚀 Server Deployment Helper
        </CardTitle>
        <CardDescription>
          Your CloudSync server needs to be deployed to Supabase Edge Functions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Check */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={checkDeployment}
            disabled={deploymentStatus === 'checking'}
            className="bg-[#F38746] hover:bg-[#e67632]"
          >
            {deploymentStatus === 'checking' ? '🔄 Checking...' : '🔍 Check Deployment Status'}
          </Button>
          
          {deploymentStatus !== 'unknown' && (
            <Badge 
              variant={deploymentStatus === 'deployed' ? 'default' : 'destructive'}
              className={deploymentStatus === 'deployed' ? 'bg-green-600' : 'bg-red-600'}
            >
              {deploymentStatus === 'checking' && <AlertCircle className="w-4 h-4 mr-1" />}
              {deploymentStatus === 'deployed' && <CheckCircle className="w-4 h-4 mr-1" />}
              {deploymentStatus === 'not-deployed' && <XCircle className="w-4 h-4 mr-1" />}
              {deploymentStatus === 'checking' && 'Checking...'}
              {deploymentStatus === 'deployed' && 'Server Deployed ✅'}
              {deploymentStatus === 'not-deployed' && 'Server Not Deployed ❌'}
            </Badge>
          )}
        </div>

        {/* Deployment Instructions */}
        {deploymentStatus === 'not-deployed' && (
          <>
            <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50">
              <h3 className="text-lg text-yellow-800 mb-2">⚠️ Server Not Deployed</h3>
              <p className="text-yellow-700">
                Your CloudSync server code exists but hasn't been deployed to Supabase. Choose a deployment method below.
              </p>
            </div>

            {/* Option 1: CLI Deployment */}
            <div className="space-y-4">
              <h3 className="text-lg flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Option 1: Deploy via Supabase CLI (Recommended)
              </h3>
              
              <div className="space-y-2">
                {deployCommands.map((command, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm">
                    <span className="flex-1">{command}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(command, `command-${index}`)}
                    >
                      {copySuccess === `command-${index}` ? '✅' : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Install Supabase CLI globally</li>
                  <li>Login to your Supabase account</li>
                  <li>Link to your project</li>
                  <li>Deploy the Edge Function</li>
                </ol>
              </div>
            </div>

            {/* Option 2: Dashboard Deployment */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                Option 2: Deploy via Supabase Dashboard
              </h3>
              
              <div className="space-y-2 text-sm">
                <p><strong>Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    Go to{' '}
                    <a 
                      href={`https://supabase.com/dashboard/project/${projectId}/functions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Supabase Dashboard → Functions <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click "New Function"</li>
                  <li>Name: <code className="bg-gray-100 px-1 rounded">make-server-0b7c7173</code></li>
                  <li>Copy code from <code>/supabase/functions/server/index.tsx</code></li>
                  <li>Click "Deploy Function"</li>
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={() => copyToClipboard('make-server-0b7c7173', 'function-name')}
                className="text-sm"
              >
                {copySuccess === 'function-name' ? '✅ Copied' : 'Copy Function Name'}
              </Button>
            </div>

            {/* Environment Variables Warning */}
            <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
              <h4 className="text-blue-800 mb-1">🔧 After Deployment</h4>
              <p className="text-blue-700 text-sm">
                Make sure these environment variables are set in your Supabase project:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-700 ml-4 mt-1">
                <li><code>SUPABASE_URL</code>: https://{projectId}.supabase.co</li>
                <li><code>SUPABASE_SERVICE_ROLE_KEY</code>: (from Settings → API)</li>
              </ul>
            </div>
          </>
        )}

        {/* Success State */}
        {deploymentStatus === 'deployed' && (
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
              <h3 className="text-lg text-green-800 mb-2">🎉 Server Successfully Deployed!</h3>
              <p className="text-green-700">
                Your server is running and accessible. Now check if it has full CloudSync functionality.
              </p>
              <div className="mt-3 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${baseUrl}/server-deployment/health`, '_blank')}
                  className="text-green-700 border-green-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test Health Endpoint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${baseUrl}/make-server-0b7c7173/health`, '_blank')}
                  className="text-green-700 border-green-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Test CloudSync Health
                </Button>
              </div>
            </div>

            {/* CloudSync upgrade notice */}
            <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50">
              <h4 className="text-blue-800 mb-1">🔧 Need CloudSync Features?</h4>
              <p className="text-blue-700 text-sm">
                If your server only has basic health checks, you need to upgrade it with CloudSync functionality (signup, authentication, data sync).
              </p>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard('/UPDATED-DEPLOYED-SERVER.tsx', 'cloudsync-upgrade')}
                  className="text-blue-700 border-blue-300"
                >
                  {copySuccess === 'cloudsync-upgrade' ? '✅ Copied' : 'Get CloudSync Server Code'}
                </Button>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Check <code>/UPDATE-YOUR-DEPLOYED-SERVER.md</code> for step-by-step upgrade instructions.
              </p>
            </div>
          </div>
        )}

        {/* Alternative Option */}
        {deploymentStatus === 'not-deployed' && (
          <div className="border-t pt-4">
            <h3 className="text-lg mb-2">🛠️ Alternative: Local Development Server</h3>
            <p className="text-gray-600 text-sm mb-3">
              If deployment is difficult, I can create a simple local server for testing CloudSync features.
            </p>
            <Button variant="outline" size="sm">
              Request Local Server Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}