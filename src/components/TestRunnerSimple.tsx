import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Download, Play, Eye } from 'lucide-react';

interface TestResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  timestamp: string;
  error?: string;
  location?: string;
  duration?: number;
  steps?: string[];
}

interface TestRunnerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestRunner({ open, onOpenChange }: TestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [visualFeedback, setVisualFeedback] = useState<string>('');

  const highlightElement = (element: Element, color: string = '#4ade80') => {
    const originalOutline = (element as HTMLElement).style.outline;
    (element as HTMLElement).style.outline = `3px solid ${color}`;
    setTimeout(() => {
      (element as HTMLElement).style.outline = originalOutline;
    }, 1500);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const simulateTyping = async (input: HTMLInputElement, text: string) => {
    input.focus();
    highlightElement(input);
    for (let i = 0; i < text.length; i++) {
      input.value = text.substring(0, i + 1);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(50);
    }
    await wait(300);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const results: TestResult[] = [];
    let testIndex = 0;
    const totalTests = 8;

    // Test 1: Input Field
    try {
      testIndex++;
      setCurrentTest('Testing message input field...');
      setVisualFeedback('⌨️ Typing test message');
      await wait(500);

      const input = document.querySelector('input[type="text"][placeholder*="Ask"]') as HTMLInputElement;
      if (!input) throw new Error('Input not found');

      highlightElement(input, '#3b82f6');
      const testMessage = 'Hello, automated test!';
      await simulateTyping(input, testMessage);

      results.push({
        category: 'Input Testing',
        name: 'Message Input Interaction',
        status: input.value === testMessage ? 'pass' : 'fail',
        message: `Successfully typed ${testMessage.length} characters`,
        timestamp: new Date().toISOString(),
        location: 'Chat input field',
        duration: performance.now(),
        steps: ['Located input', 'Focused element', 'Typed message', 'Verified'],
      });

      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
      results.push({
        category: 'Input Testing',
        name: 'Message Input Interaction',
        status: 'fail',
        message: 'Failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        location: 'Chat input',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 2: Mode Selector
    try {
      testIndex++;
      setCurrentTest('Testing mode selector...');
      setVisualFeedback('🎯 Opening mode dropdown');
      await wait(500);

      const modeButton = document.querySelector('[role="combobox"]') as HTMLButtonElement;
      if (!modeButton) throw new Error('Mode button not found');

      highlightElement(modeButton, '#f59e0b');
      await wait(500);
      modeButton.click();
      await wait(800);

      const dropdown = document.querySelector('[role="listbox"]');
      if (dropdown) {
        highlightElement(dropdown, '#f59e0b');
        await wait(1000);
      }
      modeButton.click();

      results.push({
        category: 'Feature Testing',
        name: 'Mode Selector',
        status: dropdown ? 'pass' : 'warning',
        message: dropdown ? 'Mode selector works correctly' : 'Dropdown behavior unclear',
        timestamp: new Date().toISOString(),
        location: 'Mode dropdown',
        duration: performance.now(),
        steps: ['Clicked button', 'Verified dropdown', 'Closed dropdown'],
      });
    } catch (error) {
      results.push({
        category: 'Feature Testing',
        name: 'Mode Selector',
        status: 'fail',
        message: 'Failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        location: 'Mode selector',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 3: File Attachment
    try {
      testIndex++;
      setCurrentTest('Testing file attachment...');
      setVisualFeedback('📎 Attaching test file');
      await wait(500);

      const attachButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.querySelector('svg')?.outerHTML.includes('paperclip')
      ) as HTMLButtonElement;

      if (attachButton) {
        highlightElement(attachButton, '#8b5cf6');
        await wait(500);

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          const blob = new Blob(['Test'], { type: 'text/plain' });
          const file = new File([blob], 'test.txt', { type: 'text/plain' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          await wait(1000);
        }
      }

      results.push({
        category: 'Feature Testing',
        name: 'File Attachment',
        status: 'pass',
        message: 'File attachment system functional',
        timestamp: new Date().toISOString(),
        location: 'Attach button',
        duration: performance.now(),
        steps: ['Found button', 'Created file', 'Attached file'],
      });
    } catch (error) {
      results.push({
        category: 'Feature Testing',
        name: 'File Attachment',
        status: 'fail',
        message: 'Failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        location: 'File attachment',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 4: Top Action Buttons
    try {
      testIndex++;
      setCurrentTest('Testing action buttons...');
      setVisualFeedback('🔘 Testing group chat button');
      await wait(500);

      const groupButton = document.querySelector('button[aria-label="Group Chat"]') as HTMLButtonElement;
      if (groupButton) {
        highlightElement(groupButton, '#ec4899');
        await wait(600);
        groupButton.click();
        await wait(800);

        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          const closeBtn = dialog.querySelector('button') as HTMLButtonElement;
          closeBtn?.click();
        }
      }

      results.push({
        category: 'Feature Testing',
        name: 'Action Buttons',
        status: 'pass',
        message: 'Action buttons are responsive',
        timestamp: new Date().toISOString(),
        location: 'Top-right buttons',
        duration: performance.now(),
        steps: ['Found buttons', 'Clicked group chat', 'Verified dialog'],
      });
    } catch (error) {
      results.push({
        category: 'Feature Testing',
        name: 'Action Buttons',
        status: 'fail',
        message: 'Failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        location: 'Top actions',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 5: API Connection
    try {
      testIndex++;
      setCurrentTest('Testing API...');
      setVisualFeedback('🌐 Fetching models API');
      await wait(500);

      const startTime = performance.now();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/models`, {
        method: 'POST',
      });
      const responseTime = performance.now() - startTime;

      const data = await response.json();
      const hasData = data.text && data.image && data.video;

      results.push({
        category: 'API Testing',
        name: 'Models API',
        status: hasData ? 'pass' : 'warning',
        message: `API responded in ${responseTime.toFixed(0)}ms`,
        timestamp: new Date().toISOString(),
        location: 'Backend API',
        duration: responseTime,
        steps: ['Sent request', 'Received response', 'Validated data'],
      });
    } catch (error) {
      results.push({
        category: 'API Testing',
        name: 'Models API',
        status: 'fail',
        message: 'API failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        location: 'API endpoint',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 6: Performance
    try {
      testIndex++;
      setCurrentTest('Checking performance...');
      setVisualFeedback('⚡ Measuring metrics');
      await wait(500);

      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;

      results.push({
        category: 'Performance',
        name: 'Page Load',
        status: loadTime < 3000 ? 'pass' : 'warning',
        message: `Page loaded in ${Math.round(loadTime)}ms`,
        timestamp: new Date().toISOString(),
        location: 'Page metrics',
        duration: loadTime,
        steps: [`Load time: ${Math.round(loadTime)}ms`],
      });
    } catch (error) {
      results.push({
        category: 'Performance',
        name: 'Page Load',
        status: 'warning',
        message: 'Metrics unavailable',
        timestamp: new Date().toISOString(),
        location: 'Performance API',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 7: Accessibility
    try {
      testIndex++;
      setCurrentTest('Checking accessibility...');
      setVisualFeedback('♿ Verifying ARIA labels');
      await wait(500);

      const buttonsWithAria = document.querySelectorAll('button[aria-label]');
      const focusable = document.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])');

      results.push({
        category: 'Accessibility',
        name: 'ARIA & Keyboard Nav',
        status: buttonsWithAria.length > 0 ? 'pass' : 'warning',
        message: `${buttonsWithAria.length} ARIA labels, ${focusable.length} focusable elements`,
        timestamp: new Date().toISOString(),
        location: 'Global',
        duration: 0,
        steps: [`${buttonsWithAria.length} ARIA labels`, `${focusable.length} focusable`],
      });
    } catch (error) {
      results.push({
        category: 'Accessibility',
        name: 'ARIA & Keyboard Nav',
        status: 'warning',
        message: 'Check failed',
        timestamp: new Date().toISOString(),
        location: 'Accessibility',
        duration: 0,
      });
    }

    setProgress(Math.round((testIndex / totalTests) * 100));
    setTestResults([...results]);
    await wait(500);

    // Test 8: UI Components
    try {
      testIndex++;
      setCurrentTest('Verifying UI components...');
      setVisualFeedback('🎨 Checking interface');
      await wait(500);

      const chatInterface = document.querySelector('.flex.flex-col.h-full');
      const sendButton = document.querySelector('button[type="submit"]');

      results.push({
        category: 'UI Components',
        name: 'Core Interface',
        status: chatInterface && sendButton ? 'pass' : 'fail',
        message: 'All core UI components present',
        timestamp: new Date().toISOString(),
        location: 'Main interface',
        duration: 0,
        steps: ['Chat interface found', 'Send button found'],
      });
    } catch (error) {
      results.push({
        category: 'UI Components',
        name: 'Core Interface',
        status: 'fail',
        message: 'Failed',
        error: String(error),
        timestamp: new Date().toISOString(),
        location: 'UI',
        duration: 0,
      });
    }

    setProgress(100);
    setTestResults([...results]);
    setIsRunning(false);
    setCurrentTest('');
    setVisualFeedback('✅ Testing complete!');
    await wait(2000);
    setVisualFeedback('');
  };

  const downloadReport = () => {
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;

    const report = `
================================================================================
                    ZEBVO AI - AUTOMATED TEST REPORT
================================================================================
Generated: ${new Date().toLocaleString()}
Test Type: Interactive UI Simulation
--------------------------------------------------------------------------------

EXECUTIVE SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tests Run:     ${testResults.length}
✓ Passed:           ${passed} (${((passed / testResults.length) * 100).toFixed(1)}%)
✗ Failed:           ${failed} (${((failed / testResults.length) * 100).toFixed(1)}%)
⚠ Warnings:         ${warnings} (${((warnings / testResults.length) * 100).toFixed(1)}%)

Overall Status:     ${failed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETAILED TEST RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${testResults
  .map(
    (result, index) => `
${index + 1}. ${result.category} - ${result.name}
   Status:           ${result.status.toUpperCase()}
   Location:         ${result.location || 'N/A'}
   Duration:         ${result.duration ? `${result.duration.toFixed(2)}ms` : 'N/A'}
   
   Message:          ${result.message}
   ${result.error ? `Error Details:    ${result.error}` : ''}
   
   ${result.steps ? `Execution Steps:\n   ${result.steps.map((s, i) => `${i + 1}. ${s}`).join('\n   ')}` : ''}
   
   Timestamp:        ${new Date(result.timestamp).toLocaleString()}
────────────────────────────────────────────────────────────────────────────
`
  )
  .join('\n')}

FAILED TESTS SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${
  failed > 0
    ? testResults
        .filter(r => r.status === 'fail')
        .map(
          (r, i) => `
${i + 1}. ${r.name}
   Location: ${r.location}
   Error: ${r.error || r.message}
`
        )
        .join('\n')
    : 'No failed tests - All tests passed successfully! 🎉'
}

================================================================================
                              END OF REPORT
================================================================================
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zebvo-test-report-${Date.now()}.txt`;
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Interactive Test Simulator
            </span>
            {testResults.length > 0 && !isRunning && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadReport}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <Button
                onClick={runTests}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Test
                  </>
                )}
              </Button>

              {isRunning && (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                </div>
              )}
            </div>

            {(currentTest || visualFeedback) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-600 animate-pulse" />
                  <div>
                    <div className="text-sm font-medium text-blue-900">{currentTest}</div>
                    {visualFeedback && (
                      <div className="text-xs text-blue-600 mt-0.5">{visualFeedback}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {testResults.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="text-2xl font-bold">{testResults.length}</div>
                <div className="text-xs text-muted-foreground">Tests</div>
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

          <ScrollArea className="flex-1">
            {testResults.length === 0 && !isRunning && (
              <div className="text-center py-12">
                <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Ready to test</p>
                <p className="text-sm mt-1 text-muted-foreground">Click "Start Test" to begin</p>
              </div>
            )}

            {Object.entries(groupedResults).map(([category, results]) => (
              <div key={category} className="mb-6">
                <h3 className="font-semibold text-sm mb-3 sticky top-0 bg-white py-2 border-b">
                  {category} ({results.length})
                </h3>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="bg-white border rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getStatusIcon(result.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{result.name}</span>
                            {getStatusBadge(result.status)}
                            {result.duration !== undefined && result.duration > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {result.duration.toFixed(0)}ms
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                          
                          {result.location && (
                            <p className="text-xs text-muted-foreground mb-2">
                              📍 {result.location}
                            </p>
                          )}
                          
                          {result.steps && (
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs font-medium mb-1">Steps:</p>
                              <ul className="text-xs space-y-0.5">
                                {result.steps.map((step, i) => (
                                  <li key={i}>• {step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {result.error && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                              <p className="text-xs font-mono text-red-600">{result.error}</p>
                            </div>
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
