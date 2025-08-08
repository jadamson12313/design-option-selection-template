import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function CloudSyncDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');

  const log = (message: string, type: DiagnosticResult['type'] = 'info') => {
    const result: DiagnosticResult = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      message,
      type
    };
    setResults(prev => [...prev, result]);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      log('🔍 Starting CloudSync Comprehensive Diagnostics', 'info');
      log('='.repeat(60), 'info');

      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-0b7c7173`;

      // Step 1: Server Health Check
      setCurrentStep('Checking server health...');
      log('📡 STEP 1: Checking server health...', 'info');
      
      try {
        const healthResponse = await fetch(`${baseUrl}/health`);
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          log(`✅ Server is running: ${healthData.message}`, 'success');
          log(`   Service: ${healthData.service}`, 'info');
        } else {
          log(`❌ Server health check failed (${healthResponse.status})`, 'error');
          return;
        }
      } catch (error) {
        log(`❌ Cannot reach server: ${(error as Error).message}`, 'error');
        return;
      }

      // Step 2: Test Signup Process
      setCurrentStep('Testing signup process...');
      log('👤 STEP 2: Testing user signup process...', 'info');
      
      const testEmail = `diagnosis-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      const testName = 'Diagnosis User';

      log(`   Creating user: ${testEmail}`, 'info');

      try {
        const signupResponse = await fetch(`${baseUrl}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
            name: testName
          })
        });

        log(`   Signup response: ${signupResponse.status}`, 'info');
        
        const signupData = await signupResponse.json();
        
        if (signupResponse.ok) {
          log('✅ User signup successful!', 'success');
          log(`   Email confirmed: ${signupData.emailConfirmed ? 'YES' : 'NO'}`, 'info');
          
          if (signupData.needsManualConfirmation) {
            log('⚠️ Manual confirmation needed', 'warning');
          }
        } else {
          log(`❌ Signup failed: ${signupData.message}`, 'error');
          if (signupData.message?.includes('already exists')) {
            log('   ℹ️ User already exists, continuing with signin test...', 'info');
          } else {
            return;
          }
        }
      } catch (error) {
        log(`❌ Signup request failed: ${(error as Error).message}`, 'error');
        return;
      }

      // Step 3: Test Immediate Signin
      setCurrentStep('Testing immediate signin...');
      log('🔑 STEP 3: Testing immediate signin (critical test)...', 'info');
      log('   This is where the "Email not confirmed" bug usually appears...', 'info');

      try {
        // Import Supabase client dynamically
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

        const { data: { session }, error } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        if (error) {
          log(`❌ SIGNIN ERROR DETECTED: ${error.message}`, 'error');
          
          if (error.message.includes('Email not confirmed')) {
            log('🚨 CONFIRMED: "Email not confirmed" bug is present!', 'error');
            
            // Step 4: Test the email confirmation fix
            setCurrentStep('Testing email confirmation fix...');
            log('🔧 STEP 4: Testing email confirmation fix...', 'info');
            
            try {
              const confirmResponse = await fetch(`${baseUrl}/auth/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail })
              });

              log(`   Confirmation endpoint response: ${confirmResponse.status}`, 'info');

              if (confirmResponse.ok) {
                const confirmData = await confirmResponse.json();
                log('✅ Manual confirmation successful!', 'success');
                log(`   Result: ${confirmData.message}`, 'info');
                
                // Step 5: Test retry signin
                setCurrentStep('Testing signin retry...');
                log('🔄 STEP 5: Testing signin retry after confirmation...', 'info');
                log('   Waiting 2 seconds for changes to propagate...', 'info');
                await sleep(2000);
                
                const { data: { session: retrySession }, error: retryError } = await supabase.auth.signInWithPassword({
                  email: testEmail,
                  password: testPassword
                });

                if (retryError) {
                  log(`❌ RETRY SIGNIN FAILED: ${retryError.message}`, 'error');
                  log('🔥 THE EMAIL CONFIRMATION FIX IS NOT WORKING PROPERLY', 'error');
                } else {
                  log('✅ RETRY SIGNIN SUCCESSFUL!', 'success');
                  log('🎉 EMAIL CONFIRMATION FIX IS WORKING!', 'success');
                  log(`   User authenticated: ${retrySession.user.email}`, 'info');
                }
              } else {
                const confirmError = await confirmResponse.json();
                log(`❌ Manual confirmation failed: ${confirmError.message}`, 'error');
              }
            } catch (confirmError) {
              log(`❌ Confirmation request failed: ${(confirmError as Error).message}`, 'error');
            }
          } else {
            log(`⚠️ Different signin error: ${error.message}`, 'warning');
          }
        } else {
          log('✅ IMMEDIATE SIGNIN SUCCESSFUL!', 'success');
          log('🎉 NO EMAIL CONFIRMATION BUG DETECTED!', 'success');
          log(`   User authenticated: ${session.user.email}`, 'info');
        }
      } catch (signinError) {
        log(`❌ Signin test failed: ${(signinError as Error).message}`, 'error');
      }

      log('🏁 DIAGNOSIS COMPLETE', 'info');
      log('='.repeat(60), 'info');

    } catch (error) {
      log(`💥 DIAGNOSIS CRASHED: ${(error as Error).message}`, 'error');
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const clearResults = () => {
    setResults([]);
    setCurrentStep('');
  };

  const getTypeColor = (type: DiagnosticResult['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: DiagnosticResult['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 CloudSync Diagnostics
        </CardTitle>
        <CardDescription>
          Comprehensive diagnostics to identify and resolve CloudSync authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="bg-[#F38746] hover:bg-[#e67632]"
          >
            {isRunning ? '🔄 Running...' : '🚀 Run Diagnostics'}
          </Button>
          <Button 
            variant="outline" 
            onClick={clearResults}
            disabled={isRunning}
          >
            🧹 Clear
          </Button>
        </div>

        {currentStep && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="animate-spin">🔄</div>
            <span className="text-blue-500">{currentStep}</span>
          </div>
        )}

        <ScrollArea className="h-96 w-full border rounded-lg p-4 bg-gray-50">
          <div className="space-y-2 font-mono text-sm">
            {results.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Click "Run Diagnostics" to start analyzing CloudSync authentication...
              </div>
            ) : (
              results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded border ${getTypeColor(result.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 min-w-fit">
                      [{result.timestamp}]
                    </span>
                    <span>{getTypeIcon(result.type)}</span>
                    <span className="flex-1 whitespace-pre-wrap">{result.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="text-xs text-gray-500">
          <p><strong>What this diagnostic does:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tests CloudSync server health and connectivity</li>
            <li>Attempts user signup with test credentials</li>
            <li>Tests immediate signin to detect "Email not confirmed" bug</li>
            <li>Tests email confirmation fix if bug is detected</li>
            <li>Provides specific solutions based on results</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}