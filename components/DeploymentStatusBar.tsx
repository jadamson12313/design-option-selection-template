import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle, Clock, Rocket, RefreshCw } from 'lucide-react';

export function DeploymentStatusBar() {
  const [deploymentStatus, setDeploymentStatus] = useState<'needed' | 'deploying' | 'completed' | 'error'>('needed');
  const [lastDeployment, setLastDeployment] = useState<Date | null>(null);

  // Check if config.toml exists and functions need redeployment
  useEffect(() => {
    // This would normally check actual deployment status
    // For now, we'll show that deployment is needed since config.toml was just created
    setDeploymentStatus('needed');
  }, []);

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case 'needed':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'deploying':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (deploymentStatus) {
      case 'needed':
        return 'Deployment Required';
      case 'deploying':
        return 'Deploying...';
      case 'completed':
        return 'Deployed Successfully';
      case 'error':
        return 'Deployment Failed';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    switch (deploymentStatus) {
      case 'needed':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'deploying':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <div className="font-medium text-sm">{getStatusText()}</div>
          <div className="text-xs opacity-75">
            {deploymentStatus === 'needed' && 'config.toml updated - functions need redeployment'}
            {deploymentStatus === 'deploying' && 'Applying verify_jwt = false setting...'}
            {deploymentStatus === 'completed' && `Deployed ${lastDeployment?.toLocaleTimeString()}`}
            {deploymentStatus === 'error' && 'Check deployment logs for details'}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {deploymentStatus === 'needed' && (
          <Badge variant="outline" className="text-xs">
            Ready to Deploy
          </Badge>
        )}
        {deploymentStatus === 'completed' && (
          <Badge variant="default" className="text-xs bg-green-600">
            ✅ Live
          </Badge>
        )}
      </div>
    </div>
  );
}