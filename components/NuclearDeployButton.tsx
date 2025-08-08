import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CopyCodeButton } from './CopyCodeButton';
import { Badge } from './ui/badge';
import { Rocket, Terminal, CheckCircle, AlertTriangle } from 'lucide-react';

export function NuclearDeployButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);

  const deployCommand = 'supabase functions deploy make-server-0b7c7173';
  const testCommand = 'curl "https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-0b7c7173/health"';

  const deploymentSteps = [
    {
      title: "🚀 Ready to Deploy Nuclear Option",
      description: "All files configured for complete authentication bypass",
      action: "Click Deploy Now to get the command"
    },
    {
      title: "💻 Run Deployment Command",
      description: "Execute this command in your terminal",
      action: "Copy and run the deployment command"
    },
    {
      title: "🧪 Test Deployment",
      description: "Verify the nuclear option is working",
      action: "Test the health endpoint"
    },
    {
      title: "✅ Nuclear Option Active",
      description: "Authentication completely bypassed",
      action: "Continue building your application"
    }
  ];

  const handleNextStep = () => {
    if (deploymentStep < deploymentSteps.length - 1) {
      setDeploymentStep(deploymentStep + 1);
    }
  };

  const handleReset = () => {
    setDeploymentStep(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-lg"
        >
          <Rocket className="w-4 h-4 mr-1" />
          🚀 Deploy Nuclear
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-orange-600" />
            Nuclear Option Deployment
            <Badge variant="destructive" className="ml-2">Complete Auth Bypass</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-4">
            {deploymentSteps.map((_, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= deploymentStep 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < deploymentStep ? '✓' : index + 1}
                </div>
                {index < deploymentSteps.length - 1 && (
                  <div className={`w-8 h-1 ${
                    index < deploymentStep ? 'bg-orange-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">
              Step {deploymentStep + 1}: {deploymentSteps[deploymentStep].title}
            </h3>
            <p className="text-orange-700 mb-3">
              {deploymentSteps[deploymentStep].description}
            </p>
            <p className="text-sm text-orange-600">
              {deploymentSteps[deploymentStep].action}
            </p>
          </div>

          {/* Step-specific Content */}
          {deploymentStep === 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Nuclear Files Ready</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Nuclear function: <code>/supabase/functions/make-server-0b7c7173/index.ts</code></li>
                  <li>✅ Config file: <code>/supabase/config.toml</code></li>
                  <li>✅ Auth bypass: Complete authentication disabled</li>
                  <li>✅ CORS: Universal access enabled</li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={handleNextStep}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Now
                </Button>
              </div>
            </div>
          )}

          {deploymentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Deployment Command
                </h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-3">
                  {deployCommand}
                </div>
                <CopyCodeButton 
                  code={deployCommand}
                  filename="deployment-command"
                  className="w-full"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">📋 Instructions</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Open your terminal/command prompt</li>
                  <li>Navigate to your project directory</li>
                  <li>Copy and paste the command above</li>
                  <li>Press Enter to deploy</li>
                  <li>Wait for "deployed successfully" message</li>
                </ol>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleNextStep}
                  variant="outline"
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  I've Deployed → Test Now
                </Button>
              </div>
            </div>
          )}

          {deploymentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Test Nuclear Deployment
                </h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg font-mono text-sm mb-3">
                  {testCommand}
                </div>
                <CopyCodeButton 
                  code={testCommand}
                  filename="test-command"
                  className="w-full mb-3"
                />
                <p className="text-sm text-purple-700">
                  Replace <code>YOUR_PROJECT_ID</code> with your actual Supabase project ID.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">✅ Expected Response (200 status)</h4>
                <pre className="text-xs text-green-700 bg-green-100 p-2 rounded overflow-x-auto">
{`{
  "success": true,
  "nuclearMode": true,
  "authStatus": "completely-disabled",
  "status": "ok",
  "health": "healthy"
}`}
                </pre>
              </div>

              <div className="text-center">
                <Button 
                  onClick={handleNextStep}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmed Working
                </Button>
              </div>
            </div>
          )}

          {deploymentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-green-800 mb-2">🎉 Nuclear Option Successfully Deployed!</h4>
                <p className="text-green-700 mb-4">
                  Your function now responds to ALL requests without authentication checks.
                  All endpoints should return 200 status instead of 401 errors.
                </p>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Authentication Completely Bypassed
                </Badge>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🚀 What's Next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Build and test your application features</li>
                  <li>✅ All API calls will work without auth hassles</li>
                  <li>✅ Focus on functionality instead of authentication</li>
                  <li>⚠️ Remember: This disables ALL security (development only)</li>
                </ul>
              </div>

              <div className="text-center space-x-3">
                <Button 
                  onClick={() => setIsOpen(false)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Continue Building
                </Button>
                <Button 
                  onClick={handleReset}
                  variant="outline"
                >
                  Deploy Again
                </Button>
              </div>
            </div>
          )}

          {/* Troubleshooting */}
          {deploymentStep > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Troubleshooting
              </h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Still getting 401?</strong> Wait 30-60 seconds for propagation</p>
                <p><strong>Deployment failed?</strong> Check: <code>supabase login</code> and <code>supabase status</code></p>
                <p><strong>Function not found?</strong> Verify you're in the correct project directory</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}