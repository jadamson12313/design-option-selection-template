import React from 'react';
import { SupabaseFunctionDiagnostics } from './SupabaseFunctionDiagnostics';
import { SupabaseSettingsFix } from './SupabaseSettingsFix';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, Settings, TestTube } from 'lucide-react';

export function CriticalSupabaseDiagnostic() {
  return (
    <div className="p-4 space-y-4">
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <strong>CRITICAL ISSUE CONFIRMED:</strong> 401 errors persist even with ultra-minimal code (no imports, no auth logic). 
          This indicates a Supabase project-level configuration issue, not our application code.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="fix-guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fix-guide" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            🔧 Fix Settings
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            🧪 Run Tests
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fix-guide" className="mt-4">
          <SupabaseSettingsFix />
        </TabsContent>
        
        <TabsContent value="diagnostics" className="mt-4">
          <div className="space-y-4">
            <SupabaseFunctionDiagnostics />
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">What This Means</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• The issue is NOT in our application code</li>
                <li>• The Supabase project has authentication enforcement at the Edge Functions level</li>
                <li>• Even completely public endpoints are being blocked</li>
                <li>• This requires Supabase project settings changes</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}