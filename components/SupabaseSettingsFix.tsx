import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, ExternalLink, AlertTriangle, Copy, Settings, Shield, Key, Database } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function SupabaseSettingsFix() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const markStepComplete = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
      toast.success(`Step ${stepNumber} completed!`);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const steps = [
    {
      id: 1,
      title: "Open Supabase Dashboard",
      icon: <ExternalLink className="w-5 h-5" />,
      description: "Navigate to your Supabase project dashboard",
      action: (
        <Button onClick={openSupabaseDashboard} variant="outline" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Dashboard
        </Button>
      ),
      details: [
        "Go to supabase.com/dashboard",
        "Select your project from the list",
        "Ensure you're in the correct organization if you have multiple"
      ]
    },
    {
      id: 2,
      title: "Navigate to Edge Functions Settings",
      icon: <Settings className="w-5 h-5" />,
      description: "Find the Edge Functions configuration section",
      details: [
        "In the left sidebar, look for 'Edge Functions' or 'Functions'",
        "Click on it to expand the submenu",
        "Look for 'Settings' or 'Configuration' option",
        "If not visible, check under 'Project Settings' → 'Functions'"
      ]
    },
    {
      id: 3,
      title: "Check Authentication Requirements",
      icon: <Shield className="w-5 h-5" />,
      description: "Look for authentication enforcement settings",
      details: [
        "Find 'Function Authentication' or 'Auth Requirements' section",
        "Look for 'Require authentication for all functions' toggle",
        "Check 'Anonymous access' or 'Public endpoints' settings",
        "Note any 'JWT verification' or 'Bearer token' requirements"
      ]
    },
    {
      id: 4,
      title: "Disable Global Auth Enforcement",
      icon: <Key className="w-5 h-5" />,
      description: "Turn off blanket authentication requirements",
      details: [
        "Find the setting that enforces auth on ALL functions",
        "This might be labeled as:",
        "• 'Require authentication for all functions'",
        "• 'Global function authentication'", 
        "• 'Mandatory JWT verification'",
        "Turn this setting OFF or set to 'Optional'"
      ]
    },
    {
      id: 5,
      title: "Enable Anonymous/Public Access",
      icon: <Database className="w-5 h-5" />,
      description: "Allow functions to handle their own authentication",
      details: [
        "Look for 'Anonymous access' or 'Public endpoints' setting",
        "Enable this option if available",
        "Set 'Default function access' to 'Public' or 'Mixed'",
        "Ensure functions can override authentication per-endpoint"
      ]
    },
    {
      id: 6,
      title: "Save and Deploy Changes",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Apply the configuration changes",
      details: [
        "Click 'Save' or 'Update Configuration'",
        "Wait for changes to be applied (may take 1-2 minutes)",
        "Look for 'Deployment successful' or similar confirmation",
        "The changes should propagate to all edge locations"
      ]
    }
  ];

  const alternativeLocations = [
    "Project Settings → API → Function Authentication",
    "Dashboard → Functions → Global Settings",
    "Project Settings → Security → Edge Functions",
    "Functions → Settings → Authentication Policy",
    "API Settings → Edge Function Policies"
  ];

  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-6 h-6" />
            Critical Issue: Global Function Authentication Enforcement
          </CardTitle>
          <CardDescription className="text-red-600">
            Your Supabase project has authentication enforcement enabled at the Edge Functions level, 
            blocking ALL function calls regardless of individual function code. This must be fixed in 
            your Supabase project dashboard settings.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {steps.map((step) => (
          <Card key={step.id} className={`transition-all ${
            completedSteps.includes(step.id) ? 'border-green-200 bg-green-50' : 'border-gray-200'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    completedSteps.includes(step.id) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {completedSteps.includes(step.id) ? <CheckCircle className="w-5 h-5" /> : step.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Step {step.id}: {step.title}
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.action}
                  <Button
                    onClick={() => markStepComplete(step.id)}
                    variant={completedSteps.includes(step.id) ? "default" : "outline"}
                    size="sm"
                  >
                    {completedSteps.includes(step.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Done
                      </>
                    ) : (
                      'Mark Complete'
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {step.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Settings className="w-5 h-5" />
            Can't Find the Settings? Try These Locations:
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alternativeLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-yellow-100 rounded border">
                <span className="text-sm text-yellow-800">{location}</span>
                <Button
                  onClick={() => copyToClipboard(location, `Location ${index + 1}`)}
                  variant="ghost" 
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-yellow-700">
            💡 <strong>Tip:</strong> Use your browser's search function (Ctrl+F) to search for keywords like 
            "authentication", "JWT", "enforce", or "global" within your Supabase dashboard.
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            ✅ Config File Already Created!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-green-700 space-y-2">
          <div>✅ <strong>config.toml</strong> has been created with <code>verify_jwt = false</code></div>
          <div>⚠️ <strong>Functions must be redeployed</strong> for this setting to take effect</div>
          <div>🚀 <strong>Run deployment commands</strong> to apply the configuration</div>
          <div>🧪 <strong>Test endpoints</strong> after deployment completes</div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <ExternalLink className="w-5 h-5" />
            🚀 Deploy Functions Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-orange-700 mb-3">
              <strong>Critical:</strong> The config.toml file has been created, but functions must be redeployed for the changes to take effect.
            </div>
            
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
              <div># 1. Login to Supabase</div>
              <div>supabase login</div>
              <div className="mt-2"># 2. Deploy functions</div>
              <div>supabase functions deploy make-server-0b7c7173</div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => copyToClipboard('supabase functions deploy make-server-0b7c7173', 'Deploy command')}
                variant="outline" 
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Deploy Command
              </Button>
              <Button
                onClick={() => window.open('REDEPLOY-FUNCTIONS-NOW.md', '_blank')}
                variant="outline" 
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Instructions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Badge variant="secondary" className="px-4 py-2">
          Progress: {completedSteps.length} of {steps.length} steps completed
        </Badge>
      </div>
    </div>
  );
}