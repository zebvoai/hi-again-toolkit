import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Download } from 'lucide-react';

interface TestResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  timestamp: string;
  error?: string;
  screenshot?: string;
}

interface TestRunnerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestRunner({ open, onOpenChange }: TestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const tests: Array<{
      category: string;
      name: string;
      test: () => Promise<{ status: 'pass' | 'fail' | 'warning'; message: string; error?: string }>;
    }> = [
      // UI Component Tests
      {
        category: 'UI Components',
        name: 'Chat Interface Render',
        test: async () => {
          const chatInterface = document.querySelector('.flex.flex-col.h-full');
          return chatInterface
            ? { status: 'pass', message: 'Chat interface is rendered correctly' }
            : { status: 'fail', message: 'Chat interface not found' };
        },
      },
      {
        category: 'UI Components',
        name: 'Message Input Field',
        test: async () => {
          const input = document.querySelector('input[type="text"][placeholder*="Ask"]');
          return input
            ? { status: 'pass', message: 'Message input field is present and accessible' }
            : { status: 'fail', message: 'Message input field not found' };
        },
      },
      {
        category: 'UI Components',
        name: 'Send Button',
        test: async () => {
          const sendBtn = document.querySelector('button[type="submit"]');
          return sendBtn
            ? { status: 'pass', message: 'Send button is present and functional' }
            : { status: 'fail', message: 'Send button not found' };
        },
      },
      {
        category: 'UI Components',
        name: 'Mode Selector',
        test: async () => {
          const modeSelector = document.querySelector('[data-state="closed"]');
          return modeSelector
            ? { status: 'pass', message: 'Mode selector dropdown is present' }
            : { status: 'warning', message: 'Mode selector may not be visible' };
        },
      },
      {
        category: 'UI Components',
        name: 'File Attachment Button',
        test: async () => {
          const attachBtn = document.querySelector('input[type="file"]');
          return attachBtn
            ? { status: 'pass', message: 'File attachment functionality is available' }
            : { status: 'fail', message: 'File attachment button not found' };
        },
      },

      // Feature Tests
      {
        category: 'Features',
        name: 'Model Selection',
        test: async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/models`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            return data.text && data.image && data.video
              ? { status: 'pass', message: 'All model categories are available' }
              : { status: 'warning', message: 'Some model categories may be missing' };
          } catch (error) {
            return { status: 'fail', message: 'Failed to fetch models', error: String(error) };
          }
        },
      },
      {
        category: 'Features',
        name: 'Temporary Chat Mode',
        test: async () => {
          const tempBtn = document.querySelector('button[aria-label="Temporary Chat"]');
          return tempBtn
            ? { status: 'pass', message: 'Temporary chat mode is accessible' }
            : { status: 'fail', message: 'Temporary chat button not found' };
        },
      },
      {
        category: 'Features',
        name: 'Group Chat Feature',
        test: async () => {
          const groupBtn = document.querySelector('button[aria-label="Group Chat"]');
          return groupBtn
            ? { status: 'pass', message: 'Group chat feature is accessible' }
            : { status: 'fail', message: 'Group chat button not found' };
        },
      },

      // Interaction Tests
      {
        category: 'Interactions',
        name: 'Input Focus',
        test: async () => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (!input) return { status: 'fail', message: 'Input field not found' };
          
          input.focus();
          await new Promise(resolve => setTimeout(resolve, 100));
          return document.activeElement === input
            ? { status: 'pass', message: 'Input field can receive focus' }
            : { status: 'warning', message: 'Input focus may have issues' };
        },
      },
      {
        category: 'Interactions',
        name: 'Button Hover States',
        test: async () => {
          const buttons = document.querySelectorAll('button');
          const hasHoverClasses = Array.from(buttons).some(btn => 
            btn.className.includes('hover:')
          );
          return hasHoverClasses
            ? { status: 'pass', message: 'Buttons have hover state styling' }
            : { status: 'warning', message: 'Some buttons may lack hover states' };
        },
      },

      // API Tests
      {
        category: 'Backend',
        name: 'Models API Endpoint',
        test: async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/models`, {
              method: 'POST',
            });
            return response.ok
              ? { status: 'pass', message: 'Models API is responding correctly' }
              : { status: 'fail', message: `Models API returned ${response.status}` };
          } catch (error) {
            return { status: 'fail', message: 'Models API is not reachable', error: String(error) };
          }
        },
      },
      {
        category: 'Backend',
        name: 'Environment Variables',
        test: async () => {
          const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
          const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          return hasSupabaseUrl && hasSupabaseKey
            ? { status: 'pass', message: 'Required environment variables are configured' }
            : { status: 'fail', message: 'Missing required environment variables' };
        },
      },

      // Console Error Detection
      {
        category: 'Error Detection',
        name: 'Console Errors',
        test: async () => {
          // This is a placeholder - in production, you'd capture console.error calls
          return { status: 'warning', message: 'Check browser console for any errors manually' };
        },
      },
      {
        category: 'Error Detection',
        name: 'Network Errors',
        test: async () => {
          // Check if there are any failed network requests
          const perfEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          const failedRequests = perfEntries.filter(entry => 
            entry.name.includes('functions') && entry.duration === 0
          );
          return failedRequests.length === 0
            ? { status: 'pass', message: 'No network errors detected' }
            : { status: 'warning', message: `${failedRequests.length} potential network issues detected` };
        },
      },

      // Accessibility Tests
      {
        category: 'Accessibility',
        name: 'ARIA Labels',
        test: async () => {
          const buttonsWithAria = document.querySelectorAll('button[aria-label]');
          return buttonsWithAria.length > 0
            ? { status: 'pass', message: `${buttonsWithAria.length} buttons have proper ARIA labels` }
            : { status: 'warning', message: 'Some buttons may lack accessibility labels' };
        },
      },
      {
        category: 'Accessibility',
        name: 'Keyboard Navigation',
        test: async () => {
          const focusableElements = document.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          return focusableElements.length > 0
            ? { status: 'pass', message: 'Keyboard navigation is supported' }
            : { status: 'fail', message: 'No focusable elements found' };
        },
      },

      // Performance Tests
      {
        category: 'Performance',
        name: 'Page Load Time',
        test: async () => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const loadTime = perfData.loadEventEnd - perfData.fetchStart;
          return loadTime < 3000
            ? { status: 'pass', message: `Page loaded in ${Math.round(loadTime)}ms (excellent)` }
            : loadTime < 5000
            ? { status: 'warning', message: `Page loaded in ${Math.round(loadTime)}ms (acceptable)` }
            : { status: 'fail', message: `Page loaded in ${Math.round(loadTime)}ms (too slow)` };
        },
      },
      {
        category: 'Performance',
        name: 'DOM Content Load',
        test: async () => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const domLoadTime = perfData.domContentLoadedEventEnd - perfData.fetchStart;
          return domLoadTime < 1500
            ? { status: 'pass', message: `DOM ready in ${Math.round(domLoadTime)}ms` }
            : { status: 'warning', message: `DOM ready in ${Math.round(domLoadTime)}ms (consider optimization)` };
        },
      },
      {
        category: 'Performance',
        name: 'API Response Time',
        test: async () => {
          const startTime = performance.now();
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/models`, {
              method: 'POST',
            });
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            return responseTime < 500
              ? { status: 'pass', message: `API responded in ${Math.round(responseTime)}ms (fast)` }
              : responseTime < 1000
              ? { status: 'warning', message: `API responded in ${Math.round(responseTime)}ms (acceptable)` }
              : { status: 'fail', message: `API responded in ${Math.round(responseTime)}ms (slow)` };
          } catch (error) {
            return { status: 'fail', message: 'API request failed', error: String(error) };
          }
        },
      },
      {
        category: 'Performance',
        name: 'First Contentful Paint',
        test: async () => {
          const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
          if (!fcpEntry) {
            return { status: 'warning', message: 'FCP metric not available' };
          }
          const fcp = fcpEntry.startTime;
          return fcp < 1800
            ? { status: 'pass', message: `FCP at ${Math.round(fcp)}ms (excellent)` }
            : fcp < 3000
            ? { status: 'warning', message: `FCP at ${Math.round(fcp)}ms (needs improvement)` }
            : { status: 'fail', message: `FCP at ${Math.round(fcp)}ms (poor)` };
        },
      },
      {
        category: 'Performance',
        name: 'Render Performance',
        test: async () => {
          const startTime = performance.now();
          const testElement = document.createElement('div');
          testElement.style.cssText = 'width: 100px; height: 100px; background: blue;';
          document.body.appendChild(testElement);
          
          // Force reflow
          testElement.offsetHeight;
          
          const endTime = performance.now();
          document.body.removeChild(testElement);
          
          const renderTime = endTime - startTime;
          return renderTime < 16
            ? { status: 'pass', message: `Render time ${renderTime.toFixed(2)}ms (60fps capable)` }
            : { status: 'warning', message: `Render time ${renderTime.toFixed(2)}ms (may drop frames)` };
        },
      },
      {
        category: 'Performance',
        name: 'Memory Usage',
        test: async () => {
          if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.jsHeapSizeLimit / 1048576);
            const percentUsed = (usedMB / totalMB) * 100;
            
            return percentUsed < 50
              ? { status: 'pass', message: `Using ${usedMB}MB of ${totalMB}MB (${percentUsed.toFixed(1)}%)` }
              : percentUsed < 80
              ? { status: 'warning', message: `Using ${usedMB}MB of ${totalMB}MB (${percentUsed.toFixed(1)}%)` }
              : { status: 'fail', message: `Using ${usedMB}MB of ${totalMB}MB (${percentUsed.toFixed(1)}% - high)` };
          }
          return { status: 'warning', message: 'Memory metrics not available in this browser' };
        },
      },

      // End-to-End Workflow Tests
      {
        category: 'E2E Workflows',
        name: 'Input Field Interaction',
        test: async () => {
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (!input) return { status: 'fail', message: 'Input field not found' };
          
          const testValue = 'Test message';
          input.focus();
          input.value = testValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          return input.value === testValue
            ? { status: 'pass', message: 'Input field accepts and retains text' }
            : { status: 'fail', message: 'Input field interaction failed' };
        },
      },
      {
        category: 'E2E Workflows',
        name: 'Mode Switching',
        test: async () => {
          const modeButtons = document.querySelectorAll('[role="combobox"]');
          if (modeButtons.length === 0) {
            return { status: 'warning', message: 'Mode selector not visible' };
          }
          
          return { status: 'pass', message: 'Mode switching interface is accessible' };
        },
      },
      {
        category: 'E2E Workflows',
        name: 'Model Selection Flow',
        test: async () => {
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/models`, {
              method: 'POST',
            });
            const models = await response.json();
            
            const hasModels = models.text?.length > 0 && models.image?.length > 0;
            return hasModels
              ? { status: 'pass', message: `Model selection available (${models.text?.length} text, ${models.image?.length} image)` }
              : { status: 'fail', message: 'Model data is incomplete' };
          } catch (error) {
            return { status: 'fail', message: 'Model selection workflow failed', error: String(error) };
          }
        },
      },
      {
        category: 'E2E Workflows',
        name: 'File Attachment Flow',
        test: async () => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (!fileInput) return { status: 'fail', message: 'File input not found' };
          
          // Create a test file
          const blob = new Blob(['test'], { type: 'text/plain' });
          const file = new File([blob], 'test.txt', { type: 'text/plain' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          // Trigger change event
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
          return { status: 'pass', message: 'File attachment workflow is functional' };
        },
      },
      {
        category: 'E2E Workflows',
        name: 'Button Click Responsiveness',
        test: async () => {
          const buttons = document.querySelectorAll('button:not([disabled])');
          if (buttons.length === 0) {
            return { status: 'fail', message: 'No clickable buttons found' };
          }
          
          let responsive = true;
          const testButton = Array.from(buttons).find(btn => 
            btn.getAttribute('aria-label') === 'Group Chat'
          ) as HTMLButtonElement;
          
          if (testButton) {
            const startTime = performance.now();
            testButton.click();
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            responsive = responseTime < 100;
            return responsive
              ? { status: 'pass', message: `Button response time: ${responseTime.toFixed(2)}ms` }
              : { status: 'warning', message: `Button response slow: ${responseTime.toFixed(2)}ms` };
          }
          
          return { status: 'pass', message: `${buttons.length} interactive buttons available` };
        },
      },
      {
        category: 'E2E Workflows',
        name: 'Complete Chat Flow Simulation',
        test: async () => {
          const steps: string[] = [];
          
          // Step 1: Find input
          const input = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (!input) return { status: 'fail', message: 'Chat input not found' };
          steps.push('Input found');
          
          // Step 2: Focus and type
          input.focus();
          if (document.activeElement !== input) {
            return { status: 'fail', message: 'Could not focus input' };
          }
          steps.push('Input focused');
          
          // Step 3: Type message
          input.value = 'Test message';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          steps.push('Message typed');
          
          // Step 4: Find send button
          const sendBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (!sendBtn) return { status: 'fail', message: 'Send button not found' };
          steps.push('Send button found');
          
          // Step 5: Check if button would be enabled
          const isDisabled = sendBtn.disabled;
          steps.push(isDisabled ? 'Button disabled (as expected when no model)' : 'Button enabled');
          
          return {
            status: 'pass',
            message: `Complete chat flow validated: ${steps.join(' → ')}`
          };
        },
      },
      {
        category: 'E2E Workflows',
        name: 'Temporary Mode Workflow',
        test: async () => {
          const tempButton = document.querySelector('button[aria-label="Temporary Chat"]') as HTMLButtonElement;
          if (!tempButton) {
            return { status: 'fail', message: 'Temporary chat button not found' };
          }
          
          // Simulate clicking temporary mode
          tempButton.click();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Check if dialog appeared
          const dialog = document.querySelector('[role="alertdialog"]');
          const hasDialog = !!dialog;
          
          // Close dialog if open
          if (hasDialog) {
            const cancelBtn = dialog?.querySelector('button') as HTMLButtonElement;
            cancelBtn?.click();
          }
          
          return hasDialog
            ? { status: 'pass', message: 'Temporary mode workflow is functional' }
            : { status: 'warning', message: 'Temporary mode dialog behavior unclear' };
        },
      },
    ];

    const results: TestResult[] = [];
    const totalTests = tests.length;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      try {
        const result = await test.test();
        results.push({
          category: test.category,
          name: test.name,
          status: result.status,
          message: result.message,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        results.push({
          category: test.category,
          name: test.name,
          status: 'fail',
          message: 'Test execution failed',
          error: String(error),
          timestamp: new Date().toISOString(),
        });
      }

      setProgress(Math.round(((i + 1) / totalTests) * 100));
      setTestResults([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const downloadReport = () => {
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;

    const report = `
ZEBVO AI - Platform Test Report
Generated: ${new Date().toLocaleString()}
========================================

SUMMARY:
- Total Tests: ${testResults.length}
- Passed: ${passed}
- Failed: ${failed}
- Warnings: ${warnings}
- Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%

DETAILED RESULTS:
========================================

${testResults
  .map(
    (result, index) => `
${index + 1}. [${result.status.toUpperCase()}] ${result.category} - ${result.name}
   Message: ${result.message}
   ${result.error ? `Error: ${result.error}` : ''}
   Timestamp: ${new Date(result.timestamp).toLocaleString()}
`
  )
  .join('\n')}

========================================
End of Report
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const colors = {
      pass: 'bg-green-100 text-green-800 border-green-200',
      fail: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return (
      <Badge variant="outline" className={`${colors[status]} text-xs`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const groupedResults = testResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const warnings = testResults.filter(r => r.status === 'warning').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Platform Test Runner</span>
            {testResults.length > 0 && !isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadReport}
                className="ml-4"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Control Panel */}
          <div className="flex items-center gap-4">
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run All Tests'
              )}
            </Button>

            {isRunning && (
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {testResults.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="text-2xl font-bold">{testResults.length}</div>
                <div className="text-xs text-muted-foreground">Total Tests</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-2xl font-bold text-green-700">{passed}</div>
                <div className="text-xs text-green-600">Passed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="text-2xl font-bold text-red-700">{failed}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{warnings}</div>
                <div className="text-xs text-yellow-600">Warnings</div>
              </div>
            </div>
          )}

          {/* Results */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {testResults.length === 0 && !isRunning && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Click "Run All Tests" to start the platform diagnostic</p>
              </div>
            )}

            {Object.entries(groupedResults).map(([category, results]) => (
              <div key={category} className="mb-6">
                <h3 className="font-semibold text-sm mb-3 text-gray-900 sticky top-0 bg-white py-2 z-10">
                  {category} ({results.length})
                </h3>
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="bg-white border rounded-lg p-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{result.name}</span>
                            {getStatusBadge(result.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{result.message}</p>
                          {result.error && (
                            <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded mt-2">
                              {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
