import { useState } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight, Download, Columns2, LayoutList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { MultiModelContent } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatModelName } from '@/lib/utils';
interface MultiModelResponseProps {
  content: MultiModelContent;
  models: string[];
}
export const MultiModelResponse = ({
  content,
  models
}: MultiModelResponseProps) => {
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('compare');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const getProviderColor = (model: string): string => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('gpt') || modelLower.includes('openai')) return 'from-emerald-500 to-teal-600';
    if (modelLower.includes('gemini') || modelLower.includes('google')) return 'from-blue-500 to-indigo-600';
    if (modelLower.includes('claude') || modelLower.includes('anthropic')) return 'from-orange-400 to-amber-600';
    if (modelLower.includes('perplexity')) return 'from-purple-500 to-violet-600';
    if (modelLower.includes('qwen')) return 'from-cyan-500 to-blue-600';
    if (modelLower.includes('cohere')) return 'from-rose-500 to-pink-600';
    return 'from-slate-500 to-slate-600';
  };
  const handleCopy = (model: string) => {
    navigator.clipboard.writeText(content[model]);
    setCopiedModel(model);
    toast({
      description: 'Copied to clipboard',
      duration: 2000
    });
    setTimeout(() => setCopiedModel(null), 2000);
  };
  const handleDownload = (model: string) => {
    const blob = new Blob([content[model]], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formatModelName(model)}-response.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      description: 'Response downloaded',
      duration: 2000
    });
  };

  // Shared markdown components
  const markdownComponents = {
    code({
      inline,
      className,
      children,
      ...props
    }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? <div className="my-2 rounded-lg overflow-hidden">
          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div> : <code className="bg-muted/60 px-1.5 py-0.5 rounded text-[12px] font-mono" {...props}>
          {children}
        </code>;
    },
    p: ({
      children
    }: any) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
    ul: ({
      children
    }: any) => <ul className="list-disc list-outside ml-4 mb-2.5 space-y-1">{children}</ul>,
    ol: ({
      children
    }: any) => <ol className="list-decimal list-outside ml-4 mb-2.5 space-y-1">{children}</ol>,
    li: ({
      children
    }: any) => <li className="leading-relaxed">{children}</li>,
    strong: ({
      children
    }: any) => <strong className="font-semibold">{children}</strong>,
    h1: ({
      children
    }: any) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
    h2: ({
      children
    }: any) => <h2 className="text-sm font-bold mb-1.5 mt-2.5 first:mt-0">{children}</h2>,
    h3: ({
      children
    }: any) => <h3 className="text-sm font-semibold mb-1.5 mt-2 first:mt-0">{children}</h3>,
    table: ({
      children
    }: any) => <div className="my-2.5 overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-xs border-collapse">{children}</table>
      </div>,
    thead: ({
      children
    }: any) => <thead className="bg-muted/50">{children}</thead>,
    tbody: ({
      children
    }: any) => <tbody className="divide-y divide-border/30">{children}</tbody>,
    tr: ({
      children
    }: any) => <tr className="hover:bg-muted/20 transition-colors">{children}</tr>,
    th: ({
      children
    }: any) => <th className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-foreground/80 border-b border-border/40 whitespace-nowrap">{children}</th>,
    td: ({
      children
    }: any) => <td className="px-2.5 py-1.5 text-[12px] text-foreground/90">{children}</td>
  };

  // Single view (carousel)
  if (viewMode === 'single') {
    const currentModel = models[currentIndex];
    const currentContent = content[currentModel] || '';
    return <div className="w-full px-4 sm:px-6 appear-smooth mt-16">
        {/* Header with toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="inline-flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/30">
              <button onClick={() => setViewMode('single')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-card text-foreground shadow-sm transition-all duration-fast ease-gentle">
                <LayoutList className="w-3.5 h-3.5" />
                Single
              </button>
              <button onClick={() => setViewMode('compare')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-fast ease-gentle">
                <Columns2 className="w-3.5 h-3.5" />
                Compare
              </button>
            </div>
          </div>
          
          {/* Model navigation */}
          {models.length > 1 && <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} of {models.length}
              </span>
              <div className="flex items-center gap-0.5">
                <button onClick={() => setCurrentIndex(prev => (prev - 1 + models.length) % models.length)} className="w-7 h-7 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-all duration-fast ease-gentle hover:scale-hover active:scale-press">
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => setCurrentIndex(prev => (prev + 1) % models.length)} className="w-7 h-7 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-all duration-fast ease-gentle hover:scale-hover active:scale-press">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>}
        </div>

        {/* Response Card */}
        <div className="max-w-3xl">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getProviderColor(currentModel)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <span className="text-white font-semibold text-xs">
                {formatModelName(currentModel).charAt(0)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Model name */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-foreground/80">
                  {formatModelName(currentModel)}
                </span>
              </div>
              
              {/* Content */}
              <div className="bg-card rounded-xl border border-border/30 p-4 shadow-sm">
                <div className="prose prose-sm max-w-none text-foreground text-[13px] leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {currentContent}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-2">
                <button onClick={() => handleCopy(currentModel)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-all duration-fast ease-gentle active:scale-press">
                  {copiedModel === currentModel ? <><Check className="w-3.5 h-3.5 text-primary" /><span className="text-primary">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
                </button>
                <button onClick={() => handleDownload(currentModel)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/50 transition-all duration-fast ease-gentle active:scale-press">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Disclaimer section */}
        <div className="mt-4 px-3 py-3 rounded-lg bg-muted/50 border border-border/50 max-w-3xl">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground/80">Note:</span> This response is generated by the selected model, not by Zebvo AI. 
            Zebvo AI is not responsible for any inaccurate information, hallucinations, or mistakes that may appear in the response. 
            For better accuracy, try multiple models and compare the results. Once you find the output you like, deselect the other models and use a single model consistently to get better results.
          </p>
        </div>
      </div>;
  }

  // Compare view - horizontal scroll with equal height cards
  return <div className="w-full appear-smooth mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Toggle */}
          <div className="inline-flex items-center p-0.5 bg-muted/40 rounded-lg border border-border/30">
            <button onClick={() => setViewMode('single')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-fast ease-gentle">
              <LayoutList className="w-3.5 h-3.5" />
              Single
            </button>
            <button onClick={() => setViewMode('compare')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-card text-foreground shadow-sm transition-all duration-fast ease-gentle">
              <Columns2 className="w-3.5 h-3.5" />
              Compare
            </button>
          </div>
          <span className="text-[11px] sm:text-xs text-muted-foreground">
            {models.length} models
          </span>
        </div>
        
        {/* Scroll hint */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <ChevronLeft className="w-3 h-3" />
          <span>Scroll to compare</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Scrollable Cards Container */}
      <div className="relative">
        {/* Gradient fades */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="overflow-x-auto scrollbar-hide scroll-smooth pb-2">
          <div className="flex gap-2.5 sm:gap-3 px-3 sm:px-6 stagger-cards" style={{
          minWidth: 'min-content'
        }}>
            {models.map((model, idx) => {
            const response = content[model] || '';
            const isGenerating = !response || response.trim() === '';
            return <div key={model} className="w-[260px] sm:w-[340px] lg:w-[380px] flex-shrink-0 flex flex-col bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden hover:shadow-md hover:border-border/60 hover:-translate-y-1 transition-all duration-normal ease-spring" style={{
              minHeight: '180px',
              maxHeight: '400px'
            }}>
                  {/* Card Header - Fixed height with model indicator */}
                  <div className="flex-shrink-0 h-11 px-3 border-b border-border/20 bg-muted/20 flex items-center gap-2.5">
                    {/* Color indicator */}
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${getProviderColor(model)}`} />
                    
                    {/* Model info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-foreground truncate block">
                        {formatModelName(model)}
                      </span>
                    </div>
                    
                    {/* Model number badge */}
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Response Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-3 min-h-0">
                  <div className="text-[13px] leading-[1.6] text-foreground">
                      {isGenerating ? <div className="space-y-2.5 py-1">
                          <Skeleton className="h-3.5 w-[95%]" />
                          <Skeleton className="h-3.5 w-[80%]" />
                          <Skeleton className="h-3.5 w-[88%]" />
                          <Skeleton className="h-3.5 w-[70%]" />
                        </div> : <div className="animate-fade-in">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {response}
                          </ReactMarkdown>
                        </div>}
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="flex-shrink-0 h-9 px-2 border-t border-border/15 bg-muted/10 flex items-center gap-1">
                    <button onClick={() => handleCopy(model)} className="h-7 px-2 rounded-md hover:bg-muted/60 transition-all duration-fast ease-gentle flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground active:scale-press" title="Copy response">
                      {copiedModel === model ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                    <button onClick={() => handleDownload(model)} className="h-7 px-2 rounded-md hover:bg-muted/60 transition-all duration-fast ease-gentle flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ml-auto active:scale-press" title="Download response">
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </div>
      
      {/* Disclaimer section */}
      <p className="text-xs text-muted-foreground mt-4 px-3 sm:px-6">
        <span className="font-medium">Note:</span> This response is generated by the selected model, not by Zebvo AI. Zebvo AI is not responsible for any inaccurate information, hallucinations, or mistakes that may appear in the response. For better accuracy, try multiple models and compare the results. Once you find the output you like, deselect the other models and use a single model consistently to get better results.
      </p>
    </div>;
};