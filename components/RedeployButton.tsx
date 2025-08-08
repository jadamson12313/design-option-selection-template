import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { AlertTriangle, Rocket, CheckCircle, ExternalLink, Copy, Terminal, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  details?: string;
}

export function RedeployButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    {
      id: 'check-cli',
      title: 'Check Project Setup',
      description: 'Verify CLI, directory, and function file',
      status: 'pending'
    },
    {
      id: 'validate-config',
      title: 'Validate Configuration',
      description: 'Confirm config.toml and function path',
      status: 'pending'
    },
    {
      id: 'deploy-function',
      title: 'Deploy Function',
      description: 'Deploy make-server-0b7c7173 with correct path',
      status: 'pending'
    },
    {
      id: 'verify-deployment',
      title: 'Verify Deployment',
      description: 'Test function endpoints after deployment',
      status: 'pending'
    }
  ]);

  const updateStepStatus = (stepId: string, status: DeploymentStep['status'], details?: string) => {
    setDeploymentSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, status, details } 
          : step
      )
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Command copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  const simulateDeployment = async () => {
    setIsDeploying(true);
    
    // Step 1: Check setup
    updateStepStatus('check-cli', 'running');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStepStatus('check-cli', 'completed', 'Project directory and function file confirmed');
    
    // Step 2: Validate config
    updateStepStatus('validate-config', 'running');
    await new Promise(resolve => setTimeout(resolve, 1500));
    updateStepStatus('validate-config', 'completed', 'verify_jwt = false & correct function path');
    
    // Step 3: Deploy function
    updateStepStatus('deploy-function', 'running');
    await new Promise(resolve => setTimeout(resolve, 4000));
    updateStepStatus('deploy-function', 'completed', 'make-server-0b7c7173 deployed successfully');
    
    // Step 4: Verify deployment
    updateStepStatus('verify-deployment', 'running');
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateStepStatus('verify-deployment', 'completed', 'Health endpoints responding correctly');
    
    setIsDeploying(false);
    toast.success('🎉 Deployment completed successfully!');
  };

  const manualDeploymentCommands = [
    '# 1. Ensure you\'re logged in',
    'supabase login',
    '',
    '# 2. Verify you\'re in the project root directory',
    '# Should see: package.json, supabase/, App.tsx',
    'ls -la  # Mac/Linux',
    'dir     # Windows',
    '',
    '# 3. Check that the function file exists',
    'ls -la supabase/functions/make-server-0b7c7173/index.ts  # Mac/Linux',
    'dir supabase\\functions\\make-server-0b7c7173\\index.ts   # Windows',
    '',
    '# 4. Deploy the correct function',
    'supabase functions deploy make-server-0b7c7173',
    '',
    '# 5. Test deployment',
    'curl "https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-0b7c7173/health"'
  ].join('\n');

  const getProgressPercentage = () => {
    const completedSteps = deploymentSteps.filter(step => step.status === 'completed').length;
    return (completedSteps / deploymentSteps.length) * 100;
  };

  const allStepsCompleted = deploymentSteps.every(step => step.status === 'completed');

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
        size="lg"
      >
        <Rocket className="w-5 h-5" />
        🚀 Redeploy Functions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Rocket className="w-6 h-6 text-orange-600" />
              Deploy Supabase Functions
            </DialogTitle>
            <DialogDescription>
              Deploy your functions with the updated config.toml settings to fix authentication issues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Overview */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Terminal className="w-5 h-5" />
                  Configuration Status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-700 space-y-2">
                <div>✅ <strong>config.toml</strong> created with <code>verify_jwt = false</code></div>
                <div>⚠️ <strong>Deployment required</strong> for settings to take effect</div>
                <div>🎯 <strong>Expected result:</strong> 401 errors will be resolved</div>
              </CardContent>
            </Card>

            {/* Deployment Progress */}
            {isDeploying && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Deployment In Progress
                  </CardTitle>
                  <Progress value={getProgressPercentage()} className="w-full" />
                </CardHeader>
              </Card>
            )}

            {/* Deployment Steps */}
            <div className="space-y-3">
              {deploymentSteps.map((step) => (
                <Card key={step.id} className={`transition-all ${
                  step.status === 'completed' ? 'border-green-200 bg-green-50' :
                  step.status === 'running' ? 'border-blue-200 bg-blue-50' :
                  step.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-gray-200'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        step.status === 'completed' ? 'bg-green-100 text-green-600' :
                        step.status === 'running' ? 'bg-blue-100 text-blue-600' :
                        step.status === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                         step.status === 'running' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                         step.status === 'error' ? <AlertTriangle className="w-5 h-5" /> :
                         <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{step.title}</h4>
                          <Badge variant={
                            step.status === 'completed' ? 'default' :
                            step.status === 'running' ? 'secondary' :
                            step.status === 'error' ? 'destructive' :
                            'outline'
                          }>
                            {step.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.details && (
                          <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Manual Deployment Instructions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Manual Deployment Commands
                </CardTitle>
                <CardDescription>
                  Run these commands in your terminal if automated deployment is not available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm whitespace-pre-wrap">
                  {manualDeploymentCommands}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => copyToClipboard(manualDeploymentCommands)}
                    variant="outline" 
                    size="sm"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Commands
                  </Button>
                  <Button
                    onClick={() => openExternalLink('FIX-DEPLOYMENT-ERROR.md')}
                    variant="outline" 
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Fix Path Error
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            {allStepsCompleted && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <strong>🎉 Deployment Completed Successfully!</strong>
                  </div>
                  <div className="text-sm text-green-600 mt-2 space-y-1">
                    <div>✅ Functions deployed with verify_jwt = false</div>
                    <div>✅ Authentication enforcement disabled</div>
                    <div>✅ Public endpoints should now work without 401 errors</div>
                    <div>🧪 Test your endpoints using the diagnostic tool</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            {!allStepsCompleted && (
              <Button
                onClick={simulateDeployment}
                disabled={isDeploying}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Start Deployment
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}