import { useState, useEffect } from 'react';
import { useModels } from '../hooks/useModels';
import { useModeStore } from '@/features/modes/store/modeStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Sparkles, Info, Search, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

interface ModelSelectorProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

// Model descriptions and capabilities
const modelInfo: Record<string, { description: string; strengths: string[]; speed: string; quality?: string; specialization?: string }> = {
  'GPT-5': {
    description: 'Most advanced GPT model with superior reasoning and multimodal capabilities',
    strengths: ['Complex reasoning', 'Long context', 'Multimodal', 'High accuracy'],
    speed: 'Moderate',
    quality: 'Highest',
    specialization: 'General purpose, complex tasks'
  },
  'GPT-5 Mini': {
    description: 'Balanced performance with lower cost and faster responses',
    strengths: ['Good reasoning', 'Cost effective', 'Fast responses', 'Multimodal'],
    speed: 'Fast',
    quality: 'High',
    specialization: 'Balanced performance'
  },
  'GPT-5 Nano': {
    description: 'Ultra-fast model optimized for high-volume simple tasks',
    strengths: ['Very fast', 'Low cost', 'High throughput', 'Simple tasks'],
    speed: 'Very Fast',
    quality: 'Good',
    specialization: 'Simple, high-volume tasks'
  },
  'Claude Sonnet 4.5': {
    description: 'Most intelligent Anthropic model with exceptional reasoning',
    strengths: ['Superior reasoning', 'Complex analysis', 'Long context', 'Vision'],
    speed: 'Moderate',
    quality: 'Highest',
    specialization: 'Complex reasoning, analysis'
  },
  'Claude Opus 4': {
    description: 'Highly intelligent model with advanced capabilities',
    strengths: ['Deep reasoning', 'Complex tasks', 'High accuracy', 'Extended context'],
    speed: 'Moderate',
    quality: 'Highest',
    specialization: 'Deep analysis, research'
  },
  'Claude Sonnet 3.5': {
    description: 'High-performance model with excellent reasoning and efficiency',
    strengths: ['Balanced performance', 'Good reasoning', 'Efficient', 'Vision'],
    speed: 'Fast',
    quality: 'High',
    specialization: 'General purpose, efficient'
  },
  'Claude Haiku 3.5': {
    description: 'Fastest Claude model for quick, straightforward responses',
    strengths: ['Very fast', 'Cost effective', 'Quick responses', 'Simple tasks'],
    speed: 'Very Fast',
    quality: 'Good',
    specialization: 'Quick responses, simple tasks'
  },
  'Gemini 2.5 Pro': {
    description: 'Top-tier Gemini with best multimodal and reasoning capabilities',
    strengths: ['Multimodal excellence', 'Large context', 'Complex reasoning', 'Vision'],
    speed: 'Moderate',
    quality: 'Highest',
    specialization: 'Multimodal, large context'
  },
  'Gemini 2.5 Flash': {
    description: 'Balanced Gemini model with good performance and speed',
    strengths: ['Fast responses', 'Good reasoning', 'Multimodal', 'Cost effective'],
    speed: 'Fast',
    quality: 'High',
    specialization: 'Balanced multimodal'
  },
  'Gemini 2.5 Flash Lite': {
    description: 'Fastest Gemini model for classification and simple workloads',
    strengths: ['Very fast', 'Low cost', 'Simple tasks', 'High volume'],
    speed: 'Very Fast',
    quality: 'Good',
    specialization: 'Classification, summarization'
  },
  // Image models - generic info
  'DALL-E 3': {
    description: 'Advanced image generation with high quality and prompt adherence',
    strengths: ['High quality', 'Prompt accuracy', 'Detailed images'],
    speed: 'Moderate',
    quality: 'Highest',
    specialization: 'Photorealistic and artistic images'
  },
  'Flux Pro 1.1 Ultra': {
    description: 'Premium FLUX model for ultra-high quality image generation',
    strengths: ['Ultra high quality', 'Professional results', 'Fine details'],
    speed: 'Slow',
    quality: 'Highest',
    specialization: 'Professional photography, art'
  },
  'Stable Diffusion 3.5 Large': {
    description: 'Large-scale stable diffusion model with excellent quality',
    strengths: ['High quality', 'Versatile', 'Consistent results'],
    speed: 'Moderate',
    quality: 'High',
    specialization: 'General purpose images'
  }
};

// Favorites management
const FAVORITES_STORAGE_KEY = 'model-selector-favorites';

const getFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveFavorites = (favorites: string[]) => {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore storage errors
  }
};

// Model grouping by provider
const getModelProvider = (model: string): string => {
  const modelLower = model.toLowerCase();
  
  // Text models
  if (model.includes('GPT') || model.includes('gpt') || model.includes('DALL-E')) return 'OpenAI';
  if (model.includes('Claude') || model.includes('claude')) return 'Anthropic';
  if (model.includes('Gemini') || model.includes('gemini')) return 'Google';
  
  // Image model providers
  if (modelLower.includes('wan')) return 'Alibaba';
  if (modelLower.includes('seedream') || modelLower.includes('dreamina')) return 'ByteDance';
  if (modelLower.includes('bria')) return 'Bria AI';
  if (modelLower.includes('ideogram')) return 'Ideogram AI';
  if (modelLower.includes('leonardo')) return 'Leonardo AI';
  if (modelLower.includes('luma')) return 'Luma AI';
  if (modelLower.includes('neta')) return 'Neta.art';
  if (modelLower.includes('recraft')) return 'Recraft AI';
  if (modelLower.includes('reve')) return 'Reve';
  if (modelLower.includes('runway')) return 'RunwayML';
  if (modelLower.includes('stable') || modelLower.includes('sdxl')) return 'Stability AI';
  if (modelLower.includes('flux')) return 'FLUX (Black Forest Labs)';
  if (modelLower.includes('qwen') || modelLower.includes('jib')) return 'Qwen/Jib Mix';
  if (modelLower.includes('hunyuan')) return 'Hunyuan';
  if (modelLower.includes('z-image')) return 'Z-Image';
  if (modelLower.includes('hidream')) return 'HiDream';
  if (modelLower.includes('chroma') || modelLower.includes('female') || modelLower.includes('step1x') || modelLower.includes('any llm')) return 'WaveSpeed AI';
  
  return 'Other';
};

const getModelTier = (model: string): 'premium' | 'standard' | 'fast' => {
  const modelLower = model.toLowerCase();
  if (modelLower.includes('pro') || modelLower.includes('opus')) return 'premium';
  if (modelLower.includes('mini') || modelLower.includes('nano') || modelLower.includes('flash')) return 'fast';
  return 'standard';
};

export const ModelSelector = ({ values, onChange, disabled }: ModelSelectorProps) => {
  const { models, isLoading } = useModels();
  const { selectedMode } = useModeStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Load favorites on mount
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);
  
  const availableModels = models ? models[selectedMode] : [];
  
  // Filter models based on search query
  const filteredModels = availableModels.filter(model =>
    model.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle favorite
  const toggleFavorite = (model: string) => {
    const newFavorites = favorites.includes(model)
      ? favorites.filter(f => f !== model)
      : [...favorites, model];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };
  
  // Separate favorites and non-favorites
  const favoriteModels = filteredModels.filter(m => favorites.includes(m));
  const nonFavoriteModels = filteredModels.filter(m => !favorites.includes(m));
  
  // Group non-favorite models by provider
  const groupedModels = nonFavoriteModels.reduce((acc, model) => {
    const provider = getModelProvider(model);
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, string[]>);
  
  const handleToggle = (model: string) => {
    if (values.includes(model)) {
      onChange(values.filter(m => m !== model));
    } else {
      if (values.length < 4) {
        onChange([...values, model]);
      }
    }
  };
  
  const displayText = values.length === 0 
    ? 'Select models' 
    : values.length === 1 
    ? values[0] 
    : `${values.length} models`;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled || isLoading}
            className={cn(
              "w-auto min-w-[140px] border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl text-sm px-3 py-2 h-9 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-200 shadow-sm hover:shadow-md justify-between",
              values.length > 0 && "bg-white/80 dark:bg-gray-900/80"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{isLoading ? 'Loading...' : displayText}</span>
            </div>
            <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[320px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-2xl p-3 z-[100]" 
          align="start"
        >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select Models</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Choose up to 4 models • {values.length}/4 selected
              </p>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative px-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-blue-500 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Models List with ScrollArea */}
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-4">
              {/* Favorites Section */}
              {favoriteModels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Favorites
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-300/50 via-transparent to-transparent" />
                  </div>
                  
                  <div className="space-y-1">
                    {favoriteModels.map((model) => (
                      <ModelItem
                        key={model}
                        model={model}
                        isSelected={values.includes(model)}
                        isDisabled={!values.includes(model) && values.length >= 4}
                        isFavorite={true}
                        onToggle={handleToggle}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular models grouped by provider */}
              {Object.entries(groupedModels).map(([provider, providerModels]) => (
                <div key={provider} className="space-y-2">
                  {/* Provider Label */}
                  <div className="flex items-center gap-2 px-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {provider}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                  </div>
                  
                  {/* Models in this provider */}
                  <div className="space-y-1">
                    {providerModels.map((model) => (
                      <ModelItem
                        key={model}
                        model={model}
                        isSelected={values.includes(model)}
                        isDisabled={!values.includes(model) && values.length >= 4}
                        isFavorite={favorites.includes(model)}
                        onToggle={handleToggle}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {/* Footer Info */}
          {values.length >= 4 && (
            <div className="px-2 py-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/30 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-400 text-center">
                Maximum of 4 models selected
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Model Item Component with Tooltip
interface ModelItemProps {
  model: string;
  isSelected: boolean;
  isDisabled: boolean;
  isFavorite: boolean;
  onToggle: (model: string) => void;
  onToggleFavorite: (model: string) => void;
}

const ModelItem = ({ model, isSelected, isDisabled, isFavorite, onToggle, onToggleFavorite }: ModelItemProps) => {
  const tier = getModelTier(model);
  const info = modelInfo[model];
  
  const modelButton = (
    <div className="relative group">
      <button
        onClick={() => onToggle(model)}
        disabled={isDisabled}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          "hover:bg-blue-50/80 dark:hover:bg-blue-900/20",
          isSelected && "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/20",
          isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {/* Checkbox */}
        <div className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
          isSelected 
            ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 shadow-lg shadow-blue-500/30" 
            : "border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50"
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
        
        {/* Model Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
            )}>
              {model}
            </span>
            {tier === 'premium' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-md">
                PRO
              </span>
            )}
            {tier === 'fast' && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-green-400 to-green-500 text-white rounded-md">
                FAST
              </span>
            )}
          </div>
        </div>
        
        {/* Favorite Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(model);
          }}
          className={cn(
            "flex-shrink-0 p-1 rounded-md transition-all duration-200",
            "hover:bg-amber-100 dark:hover:bg-amber-900/30",
            isFavorite ? "text-amber-500" : "text-gray-300 dark:text-gray-600"
          )}
        >
          <Star className={cn("w-4 h-4", isFavorite && "fill-amber-500")} />
        </button>
        
        {/* Info Icon */}
        {info && (
          <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        )}
      </button>
    </div>
  );
  
  if (info) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {modelButton}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="max-w-xs bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-xl border-gray-700/50 p-4 z-[150]"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-white text-sm">{model}</h4>
                {info.quality && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md whitespace-nowrap">
                    {info.quality}
                  </span>
                )}
              </div>
              
              <p className="text-xs text-gray-300 leading-relaxed">
                {info.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700/50">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Speed</p>
                  <p className="text-xs text-white font-medium">{info.speed}</p>
                </div>
                {info.specialization && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Best For</p>
                    <p className="text-xs text-white font-medium">{info.specialization}</p>
                  </div>
                )}
              </div>
              
              {info.strengths.length > 0 && (
                <div className="pt-2 border-t border-gray-700/50">
                  <p className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Strengths</p>
                  <div className="flex flex-wrap gap-1">
                    {info.strengths.map((strength, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-300 rounded-md"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return modelButton;
};
