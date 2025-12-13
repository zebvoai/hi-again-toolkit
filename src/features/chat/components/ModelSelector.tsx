import { useState, useEffect } from 'react';
import { useModels } from '../hooks/useModels';
import { useModeStore } from '@/features/modes/store/modeStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Sparkles, Info, Search, Star, X, Clock, ArrowUpDown, Zap, Crown, Scale, Wallet, Palette, Save, Trash2, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

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
  },
  // Kimi / Moonshot AI models
  'Kimi VL A3B': {
    description: 'Advanced vision-language model with strong multimodal understanding',
    strengths: ['Vision understanding', 'Multimodal', 'Image analysis', 'Document parsing'],
    speed: 'Fast',
    quality: 'High',
    specialization: 'Vision-language tasks'
  },
  'Kimi K2': {
    description: 'Latest Kimi model with enhanced reasoning and coding capabilities',
    strengths: ['Strong reasoning', 'Code generation', 'Long context', 'Math'],
    speed: 'Moderate',
    quality: 'High',
    specialization: 'Reasoning, coding, math'
  },
  'Kimi K1.5': {
    description: 'Powerful language model with excellent general capabilities',
    strengths: ['General purpose', 'Good reasoning', 'Multilingual', 'Efficient'],
    speed: 'Fast',
    quality: 'High',
    specialization: 'General purpose, multilingual'
  }
};

// Model Presets - categorized by characteristics
type PresetType = 'fast' | 'premium' | 'balanced' | 'budget' | 'creative';

interface ModelPreset {
  id: PresetType | string;
  name: string;
  description: string;
  icon: any;
  models: {
    text: string[];
    image: string[];
    video: string[];
    build: string[];
  };
  isCustom?: boolean;
}

const builtInPresets: ModelPreset[] = [
  {
    id: 'fast',
    name: 'Speed',
    description: 'Fastest models for quick responses',
    icon: Zap,
    models: {
      text: ['GPT-5 Nano', 'Claude Haiku 3.5', 'Gemini 2.5 Flash Lite'],
      image: ['Flux Schnell', 'Ideogram V2 Turbo', 'Ideogram V3 Turbo', 'Stable Diffusion'],
      video: ['Gemini Video Flash'],
      build: ['GPT-5 Nano']
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Highest quality models for best results',
    icon: Crown,
    models: {
      text: ['GPT-5', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro'],
      image: ['Flux Pro 1.1 Ultra', 'DALL-E 3', 'Ideogram V3 Balanced', 'Stable Diffusion 3.5 Large'],
      video: ['Gemini Video 2.0'],
      build: ['GPT-5', 'Claude Sonnet 4.5']
    }
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance of speed and quality',
    icon: Scale,
    models: {
      text: ['GPT-5 Mini', 'Claude Sonnet 3.5', 'Gemini 2.5 Flash'],
      image: ['Flux Dev', 'Ideogram V2', 'Recraft 20B', 'Stable Diffusion 3'],
      video: ['Gemini Video Flash'],
      build: ['GPT-5 Mini']
    }
  },
  {
    id: 'budget',
    name: 'Budget',
    description: 'Cost-effective models for high volume',
    icon: Wallet,
    models: {
      text: ['GPT-5 Nano', 'Claude Haiku 3.5', 'Gemini 2.5 Flash Lite'],
      image: ['Flux Schnell', 'DALL-E 2', 'Stable Diffusion'],
      video: ['Gemini Video Flash'],
      build: ['GPT-5 Nano']
    }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Models optimized for artistic and creative outputs',
    icon: Palette,
    models: {
      text: ['GPT-5', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro'],
      image: ['Flux Pro 1.1 Ultra', 'Flux Dev', 'DALL-E 3', 'Ideogram V3 Balanced'],
      video: ['Gemini Video 2.0'],
      build: ['GPT-5', 'Claude Sonnet 4.5']
    }
  }
];

// Storage keys
const FAVORITES_STORAGE_KEY = 'model-selector-favorites';
const RECENT_MODELS_STORAGE_KEY = 'model-selector-recent';
const CUSTOM_PRESETS_STORAGE_KEY = 'model-selector-custom-presets';

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

// Recent models management
const getRecentModels = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_MODELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentModels = (models: string[]) => {
  try {
    localStorage.setItem(RECENT_MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch {
    // Ignore storage errors
  }
};

const addToRecentModels = (model: string) => {
  const recent = getRecentModels();
  const filtered = recent.filter(m => m !== model);
  const updated = [model, ...filtered].slice(0, 5); // Keep only last 5
  saveRecentModels(updated);
};

// Custom presets management
const getCustomPresets = (): ModelPreset[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCustomPresets = (presets: ModelPreset[]) => {
  try {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage errors
  }
};

// Sorting types
type SortOption = 'alphabetical' | 'speed' | 'quality' | 'provider';

const sortModels = (models: string[], sortBy: SortOption): string[] => {
  const modelsCopy = [...models];
  
  switch (sortBy) {
    case 'alphabetical':
      return modelsCopy.sort((a, b) => a.localeCompare(b));
    
    case 'speed':
      return modelsCopy.sort((a, b) => {
        const speedOrder = { 'Very Fast': 0, 'Fast': 1, 'Moderate': 2, 'Slow': 3 };
        const speedA = modelInfo[a]?.speed || 'Moderate';
        const speedB = modelInfo[b]?.speed || 'Moderate';
        return (speedOrder[speedA as keyof typeof speedOrder] || 2) - (speedOrder[speedB as keyof typeof speedOrder] || 2);
      });
    
    case 'quality':
      return modelsCopy.sort((a, b) => {
        const qualityOrder = { 'Highest': 0, 'High': 1, 'Good': 2 };
        const qualityA = modelInfo[a]?.quality || 'Good';
        const qualityB = modelInfo[b]?.quality || 'Good';
        return (qualityOrder[qualityA as keyof typeof qualityOrder] || 2) - (qualityOrder[qualityB as keyof typeof qualityOrder] || 2);
      });
    
    case 'provider':
      return modelsCopy.sort((a, b) => {
        const providerA = getModelProvider(a);
        const providerB = getModelProvider(b);
        return providerA.localeCompare(providerB);
      });
    
    default:
      return modelsCopy;
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

const getModelTier = (model: string): 'pro' | 'premium' | 'budget' | 'standard' => {
  const modelLower = model.toLowerCase();
  
  // PRO tier - flagship models
  if (modelLower.includes('gpt-5') || modelLower.includes('gpt-4o') || 
      modelLower.includes('claude-opus') || modelLower.includes('claude-4') ||
      modelLower.includes('gemini-2.0-pro') || modelLower.includes('gemini-exp-1206') ||
      modelLower.includes('o1') || modelLower.includes('o3')) {
    return 'pro';
  }
  
  // PREMIUM tier - high-quality models
  if (modelLower.includes('pro') || modelLower.includes('opus') || 
      modelLower.includes('claude-sonnet') || modelLower.includes('gpt-4-turbo')) {
    return 'premium';
  }
  
  // BUDGET tier - cost-effective models
  if (modelLower.includes('mini') || modelLower.includes('nano') || 
      modelLower.includes('haiku') || modelLower.includes('lite') ||
      modelLower.includes('gemini-flash-8b') || modelLower.includes('gemma')) {
    return 'budget';
  }
  
  return 'standard';
};

const getModelSpeed = (model: string): 'ultrafast' | 'fast' | 'moderate' | null => {
  const modelLower = model.toLowerCase();
  
  // ULTRAFAST - optimized for speed
  if (modelLower.includes('nano') || modelLower.includes('flash-8b') || 
      modelLower.includes('gemma') || modelLower.includes('llama-3.3-70b') ||
      modelLower.includes('qwen-2.5-72b')) {
    return 'ultrafast';
  }
  
  // FAST - good balance
  if (modelLower.includes('mini') || modelLower.includes('flash') || 
      modelLower.includes('haiku') || modelLower.includes('turbo') ||
      modelLower.includes('lite')) {
    return 'fast';
  }
  
  // MODERATE - standard speed
  if (modelLower.includes('pro') || modelLower.includes('opus') || 
      modelLower.includes('sonnet')) {
    return 'moderate';
  }
  
  return null;
};

export const ModelSelector = ({ values, onChange, disabled }: ModelSelectorProps) => {
  const { models, isLoading } = useModels();
  const { selectedMode } = useModeStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentModels, setRecentModels] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('provider');
  const [customPresets, setCustomPresets] = useState<ModelPreset[]>([]);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isClicked, setIsClicked] = useState(false);
  
  // Load favorites, recent models, and custom presets on mount
  useEffect(() => {
    setFavorites(getFavorites());
    setRecentModels(getRecentModels());
    setCustomPresets(getCustomPresets());
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
  
  // Separate favorites, recent, and other models
  const favoriteModels = filteredModels.filter(m => favorites.includes(m));
  const recentFilteredModels = filteredModels.filter(m => 
    recentModels.includes(m) && !favorites.includes(m)
  );
  const nonFavoriteNonRecentModels = filteredModels.filter(m => 
    !favorites.includes(m) && !recentModels.includes(m)
  );
  
  // Sort and group non-favorite, non-recent models
  const sortedNonFavoriteNonRecentModels = sortModels(nonFavoriteNonRecentModels, sortBy);
  
  // Group by provider only if sorting by provider
  const groupedModels = sortBy === 'provider' 
    ? sortedNonFavoriteNonRecentModels.reduce((acc, model) => {
        const provider = getModelProvider(model);
        if (!acc[provider]) acc[provider] = [];
        acc[provider].push(model);
        return acc;
      }, {} as Record<string, string[]>)
    : { 'All Models': sortedNonFavoriteNonRecentModels };
  
  const handleToggle = (model: string) => {
    if (values.includes(model)) {
      onChange(values.filter(m => m !== model));
    } else {
      // Allow unlimited selection for testing
      onChange([...values, model]);
      // Add to recent models
      addToRecentModels(model);
      setRecentModels(getRecentModels());
    }
  };
  
  // Select all models (for testing purposes)
  const handleSelectAll = () => {
    onChange(availableModels);
    availableModels.forEach(model => addToRecentModels(model));
    setRecentModels(getRecentModels());
    toast.success(`Selected all ${availableModels.length} models for testing`);
  };
  
  // Clear all selections
  const handleClearAll = () => {
    onChange([]);
    setActivePresets(new Set());
    toast.success('Cleared all selections');
  };
  
  // All presets (built-in + custom)
  const allPresets = [...builtInPresets, ...customPresets];
  
  // Track active presets (multi-selection)
  const [activePresets, setActivePresets] = useState<Set<string>>(new Set());
  
  const handlePresetSelect = (presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    const presetModels = preset.models[selectedMode] || [];
    const availablePresetModels = presetModels.filter(model => availableModels.includes(model));
    
    const newActivePresets = new Set(activePresets);
    
    if (activePresets.has(presetId)) {
      // Deactivate preset - remove its models from selection
      newActivePresets.delete(presetId);
      const modelsToRemove = new Set(availablePresetModels);
      const newSelection = values.filter(m => !modelsToRemove.has(m));
      onChange(newSelection);
    } else {
      // Activate preset - add its models to selection (merge with existing)
      newActivePresets.add(presetId);
      const currentSelection = new Set(values);
      availablePresetModels.forEach(model => currentSelection.add(model));
      const newSelection = Array.from(currentSelection);
      onChange(newSelection);
      newSelection.forEach(model => addToRecentModels(model));
      setRecentModels(getRecentModels());
    }
    
    setActivePresets(newActivePresets);
  };
  
  // Check if a preset is currently active
  const isPresetActive = (presetId: string): boolean => {
    return activePresets.has(presetId);
  };
  
  // Check if current selection matches a preset
  const getMatchingPreset = (): ModelPreset | null => {
    if (values.length === 0) return null;
    
    const sortedValues = [...values].sort();
    
    for (const preset of allPresets) {
      const presetModels = preset.models[selectedMode] || [];
      const availablePresetModels = presetModels.filter(model => availableModels.includes(model)).slice(0, 4);
      const sortedPresetModels = [...availablePresetModels].sort();
      
      if (sortedValues.length === sortedPresetModels.length &&
          sortedValues.every((val, idx) => val === sortedPresetModels[idx])) {
        return preset;
      }
    }
    
    return null;
  };
  
  const matchingPreset = getMatchingPreset();
  
  // Save current selection as custom preset
  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    if (values.length === 0) {
      toast.error('Please select at least one model');
      return;
    }
    
    const newPreset: ModelPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: `Custom preset with ${values.length} model${values.length > 1 ? 's' : ''}`,
      icon: Star,
      isCustom: true,
      models: {
        text: selectedMode === 'text' ? values : [],
        image: selectedMode === 'image' ? values : [],
        video: selectedMode === 'video' ? values : [],
        build: selectedMode === 'build' ? values : []
      }
    };
    
    const updatedPresets = [...customPresets, newPreset];
    setCustomPresets(updatedPresets);
    saveCustomPresets(updatedPresets);
    
    setShowSavePresetDialog(false);
    setNewPresetName('');
    toast.success(`Preset "${newPreset.name}" saved!`);
  };
  
  // Delete custom preset
  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updatedPresets);
    saveCustomPresets(updatedPresets);
    toast.success('Preset deleted');
  };
  
  const displayText = values.length === 0 
    ? 'Select models' 
    : values.length === 1 
    ? values[0] 
    : `${values.length} models`;
  
  return (
    <>
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          setIsClicked(true);
          setTimeout(() => setIsClicked(false), 150);
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled || isLoading}
            className={cn(
              "w-auto min-w-[140px] border border-white/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl text-sm px-3 py-2 h-9 transition-all duration-150",
              "hover:border-[#D1D5DB] hover:scale-[1.01] hover:shadow-md",
              values.length > 0 && "bg-white/80 dark:bg-gray-900/80",
              "justify-between"
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{isLoading ? 'Loading...' : displayText}</span>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 ml-1 opacity-50 transition-transform duration-150",
              open && "rotate-180"
            )} />
          </Button>
        </PopoverTrigger>
      <PopoverContent 
          className={cn(
            "w-[90vw] sm:w-[420px] lg:w-[480px] max-w-[480px]",
            "max-h-[60vh] sm:max-h-[520px] lg:max-h-[580px] flex flex-col",
            "bg-white/98 dark:bg-[#1C1C1E]/98 backdrop-blur-2xl",
            "border border-black/[0.04] dark:border-white/[0.08]",
            "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.03)]",
            "rounded-[24px] p-0 z-[100]",
            "animate-in fade-in-0 zoom-in-[0.98] slide-in-from-bottom-2 duration-300 ease-out"
          )}
          align="start"
          sideOffset={8}
        >
          {/* Header - Apple Style */}
          <div className="flex-shrink-0 px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-semibold text-[#1D1D1F] dark:text-white tracking-[-0.01em]">
                  Models
                </h3>
                <p className="text-[13px] text-[#86868B] dark:text-[#98989D] mt-0.5">
                  {values.length === 0 ? 'Select up to 4 models' : (
                    <span className="text-[#0071E3] dark:text-[#2997FF]">{values.length} selected</span>
                  )}
                </p>
              </div>
              
              {/* Action Links */}
              <div className="flex items-center gap-4">
                {values.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[13px] font-medium text-[#86868B] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white transition-colors duration-200"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleSelectAll}
                  className="text-[13px] font-medium text-[#0071E3] dark:text-[#2997FF] hover:text-[#0077ED] transition-colors duration-200"
                >
                  Select All
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Apple Style */}
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] pointer-events-none" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "h-9 pl-9 pr-8 bg-[#F5F5F7] dark:bg-[#2C2C2E] border-none",
                  "rounded-lg text-[15px] placeholder:text-[#86868B]",
                  "focus-visible:ring-2 focus-visible:ring-[#0071E3]/30 focus-visible:ring-offset-0",
                  "transition-all duration-200"
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#86868B]/20 hover:bg-[#86868B]/30 text-[#86868B] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-2" style={{ scrollBehavior: 'smooth' }}>
            {/* Presets Section */}
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                  Quick Presets
                </span>
                {values.length > 0 && (
                  <button
                    onClick={() => setShowSavePresetDialog(true)}
                    className="text-[11px] font-medium text-[#0071E3] dark:text-[#2997FF] hover:opacity-80 transition-opacity"
                  >
                    Save Custom
                  </button>
                )}
              </div>
              
              {/* Horizontal Scroll Presets */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {allPresets.slice(0, 6).map((preset) => {
                  const presetModels = preset.models[selectedMode] || [];
                  const availableCount = presetModels.filter(m => availableModels.includes(m)).length;
                  const isActive = isPresetActive(preset.id);
                  
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      disabled={availableCount === 0}
                      className={cn(
                        "relative flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200",
                        isActive 
                          ? "bg-[#0071E3] text-white shadow-sm shadow-[#0071E3]/30" 
                          : "bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white",
                        !isActive && "hover:bg-[#E8E8ED] dark:hover:bg-[#3A3A3C]",
                        availableCount === 0 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      {preset.isCustom && !isActive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-[#FF3B30] text-white rounded-full hover:bg-[#FF453A] transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <span className="text-[13px] font-medium whitespace-nowrap">
                        {preset.name}
                      </span>
                      <span className={cn(
                        "text-[11px] opacity-70",
                        isActive && "opacity-90"
                      )}>
                        {availableCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Divider */}
            <div className="mx-3 h-px bg-black/[0.04] dark:bg-white/[0.08]" />
          
          
            {/* Models List */}
            <div className="px-3 py-3">
              <div className="space-y-4">
                {/* Favorites Section */}
                {favoriteModels.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <Star className="w-3 h-3 text-[#FF9F0A] fill-[#FF9F0A]" />
                      <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                        Favorites
                      </span>
                    </div>
                    
                    <div className="space-y-0.5">
                      {favoriteModels.map((model) => (
                        <ModelItem
                          key={model}
                          model={model}
                          isSelected={values.includes(model)}
                          isDisabled={false}
                          isFavorite={true}
                          onToggle={handleToggle}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}
              
                {/* Recently Used Section */}
                {recentFilteredModels.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <Clock className="w-3 h-3 text-[#0071E3]" />
                      <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                        Recent
                      </span>
                    </div>
                    
                    <div className="space-y-0.5">
                      {recentFilteredModels.map((model) => (
                        <ModelItem
                          key={model}
                          model={model}
                          isSelected={values.includes(model)}
                          isDisabled={false}
                          isFavorite={favorites.includes(model)}
                          onToggle={handleToggle}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}
              
                {/* All Models grouped by provider or sorted */}
                {Object.entries(groupedModels).map(([provider, providerModels]) => (
                  <div key={provider}>
                    {/* Provider Label - only show if grouping by provider */}
                    {sortBy === 'provider' && (
                      <div className="flex items-center gap-1.5 mb-2 px-1">
                        <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                          {provider}
                        </span>
                      </div>
                    )}
                    
                    {/* Models in this provider */}
                    <div className="space-y-0.5">
                      {providerModels.map((model) => (
                        <ModelItem
                          key={model}
                          model={model}
                          isSelected={values.includes(model)}
                          isDisabled={false}
                          isFavorite={favorites.includes(model)}
                          onToggle={handleToggle}
                          onToggleFavorite={toggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer - Apple Style */}
          <div className="flex-shrink-0 border-t border-black/[0.04] dark:border-white/[0.08] bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/80 backdrop-blur-xl px-5 py-3">
            {/* Selected Model Pills */}
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {values.slice(0, 4).map((model) => (
                  <button
                    key={model}
                    onClick={() => handleToggle(model)}
                    className="group flex items-center gap-1.5 px-2.5 py-1 bg-[#0071E3]/10 dark:bg-[#2997FF]/15 text-[#0071E3] dark:text-[#2997FF] rounded-full text-[11px] font-medium hover:bg-[#0071E3]/20 transition-all duration-200"
                  >
                    <span className="truncate max-w-[80px]">{model}</span>
                    <X className="w-3 h-3 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                  </button>
                ))}
                {values.length > 4 && (
                  <span className="px-2.5 py-1 bg-[#86868B]/10 text-[#86868B] rounded-full text-[11px] font-medium">
                    +{values.length - 4}
                  </span>
                )}
              </div>
            )}
            
            {/* Action Button - Single Apple Style */}
            <button
              onClick={() => {
                setOpen(false);
                if (values.length > 0) {
                  toast.success(`${values.length} model${values.length > 1 ? 's' : ''} selected`);
                }
              }}
              className={cn(
                "w-full h-11 rounded-xl text-[15px] font-semibold transition-all duration-200",
                values.length > 0 
                  ? "bg-[#0071E3] hover:bg-[#0077ED] text-white active:scale-[0.98]" 
                  : "bg-[#E8E8ED] dark:bg-[#3A3A3C] text-[#86868B] cursor-default"
              )}
            >
              {values.length > 0 ? `Done (${values.length})` : 'Select Models'}
            </button>
          </div>
        </PopoverContent>
    </Popover>
    
    {/* Save Preset Dialog */}
    <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>Save Custom Preset</DialogTitle>
          <DialogDescription>
            Give your preset a name. It will remember your current selection of {values.length} model{values.length > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Preset Name
            </label>
            <Input
              placeholder="e.g., My Favorite Models"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSavePreset();
                }
              }}
              className="bg-white/50 dark:bg-gray-800/50"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Selected Models
            </label>
            <div className="flex flex-wrap gap-2">
              {values.map((model) => (
                <span
                  key={model}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowSavePresetDialog(false);
              setNewPresetName('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePreset}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
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
  const speed = getModelSpeed(model);
  const info = modelInfo[model];
  
  const modelButton = (
    <div className="relative group">
      <button
        onClick={() => onToggle(model)}
        disabled={isDisabled}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
          isSelected 
            ? "bg-[#0071E3]/10 dark:bg-[#2997FF]/15" 
            : "bg-transparent",
          !isSelected && "hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
          "active:scale-[0.99]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Checkbox - Apple Style */}
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isSelected 
            ? "bg-[#0071E3] border-[#0071E3]" 
            : "border-[#C7C7CC] dark:border-[#48484A]"
        )}>
          {isSelected && (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </div>
        
        {/* Model Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[15px] font-medium truncate",
              isSelected ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#1D1D1F] dark:text-white"
            )}>
              {model}
            </span>
            
            {/* Badges - Apple Style */}
            <div className="flex items-center gap-1">
              {tier === 'premium' && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#FF9F0A] text-white rounded-full">
                  PRO
                </span>
              )}
              {tier === 'pro' && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#BF5AF2] text-white rounded-full">
                  MAX
                </span>
              )}
              {tier === 'budget' && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#30D158] text-white rounded-full">
                  LITE
                </span>
              )}
              {(speed === 'ultrafast' || speed === 'fast') && (
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#0071E3] text-white rounded-full flex items-center gap-0.5">
                  <Zap className="w-2 h-2" />
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Favorite Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(model);
          }}
          className={cn(
            "flex-shrink-0 p-1 rounded-full transition-all duration-200",
            isFavorite 
              ? "text-[#FF9F0A]" 
              : "text-[#C7C7CC] dark:text-[#48484A] hover:text-[#FF9F0A]/60"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("w-4 h-4", isFavorite && "fill-[#FF9F0A]")} />
        </button>
      </button>
    </div>
  );
  
  if (info) {
    return (
      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            {modelButton}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="max-w-[280px] bg-[#1D1D1F]/95 backdrop-blur-2xl border-white/10 p-4 rounded-xl z-[150]"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-white text-[15px]">{model}</h4>
                {info.quality && (
                  <span className="text-[11px] px-2 py-0.5 bg-[#0071E3]/20 text-[#2997FF] rounded-full whitespace-nowrap font-medium">
                    {info.quality}
                  </span>
                )}
              </div>
              
              <p className="text-[13px] text-[#98989D] leading-relaxed">
                {info.description}
              </p>
              
              <div className="flex gap-4 pt-2 border-t border-white/10">
                <div>
                  <p className="text-[10px] text-[#86868B] uppercase font-semibold tracking-wider mb-1">Speed</p>
                  <p className="text-[13px] text-white font-medium">{info.speed}</p>
                </div>
                {info.specialization && (
                  <div>
                    <p className="text-[10px] text-[#86868B] uppercase font-semibold tracking-wider mb-1">Best For</p>
                    <p className="text-[13px] text-white font-medium">{info.specialization}</p>
                  </div>
                )}
              </div>
              
              {info.strengths.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] text-[#86868B] uppercase font-semibold tracking-wider mb-2">Strengths</p>
                  <div className="flex flex-wrap gap-1.5">
                    {info.strengths.map((strength, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-1 bg-[#30D158]/15 text-[#30D158] rounded-full font-medium"
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
