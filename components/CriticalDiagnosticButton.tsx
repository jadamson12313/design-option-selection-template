import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CriticalSupabaseDiagnostic } from './CriticalSupabaseDiagnostic';
import { AlertTriangle } from 'lucide-react';

export function CriticalDiagnosticButton() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowDiagnostics(true)}
        className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 shadow-lg animate-pulse"
        size="lg"
      >
        <AlertTriangle className="w-5 h-5 mr-2" />
        🚨 CRITICAL: Fix Supabase 401 Issue
      </Button>

      <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Critical Supabase 401 Diagnostic
            </DialogTitle>
          </DialogHeader>
          <CriticalSupabaseDiagnostic />
        </DialogContent>
      </Dialog>
    </>
  );
}