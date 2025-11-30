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
    toast.success('Cleared all selections');
  };
  
  // All presets (built-in + custom)
  const allPresets = [...builtInPresets, ...customPresets];
  
  const handlePresetSelect = (presetId: string) => {
    const preset = allPresets.find(p => p.id === presetId);
    if (!preset) return;
    
    const presetModels = preset.models[selectedMode] || [];
    const availablePresetModels = presetModels.filter(model => availableModels.includes(model));
    const modelsToSelect = availablePresetModels.slice(0, 4);
    
    onChange(modelsToSelect);
    modelsToSelect.forEach(model => {
      addToRecentModels(model);
    });
    setRecentModels(getRecentModels());
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
            "w-[480px] max-w-[95vw]",
            "max-h-[600px] flex flex-col",
            "bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            "rounded-[20px] p-0 z-[100]",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
          align="start"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Select Models
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {values.length <= 4 ? (
                    <>Choose up to 4 • <span className="text-blue-600 dark:text-blue-400">{values.length} selected</span></>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-500">
                      🧪 Testing: {values.length} selected
                    </span>
                  )}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Select All
                </button>
                {values.length > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                      onClick={handleClearAll}
                      className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Blue CTA Button */}
            <button
              onClick={handleSelectAll}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
            >
              Select all models for testing
            </button>
          </div>
          
          {/* Scrollable Content Wrapper */}
          <div className="flex-1 overflow-y-auto" style={{ scrollBehavior: 'smooth' }}>
            {/* Presets Section */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Quick Presets
                  </span>
                </div>
                
                {values.length > 0 && (
                  <button
                    onClick={() => setShowSavePresetDialog(true)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    + Save Custom
                  </button>
                )}
              </div>
              
              {/* 2-column Grid Presets */}
              <div className="grid grid-cols-2 gap-2.5">
                {allPresets.slice(0, 6).map((preset) => {
                  const presetModels = preset.models[selectedMode] || [];
                  const availableCount = presetModels.filter(m => availableModels.includes(m)).length;
                  const isActive = matchingPreset?.id === preset.id;
                  
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id)}
                      disabled={availableCount === 0}
                      className={cn(
                        "relative flex flex-col items-start p-3 rounded-lg transition-all duration-200",
                        "border-[1.5px] bg-white dark:bg-gray-800",
                        isActive 
                          ? "border-blue-500 bg-[#F0F5FF] dark:bg-blue-900/20" 
                          : "border-[#E5E7EB] dark:border-gray-700",
                        !isActive && "hover:border-[#5B9FFF] hover:bg-[#F8FBFF] hover:-translate-y-0.5",
                        availableCount === 0 && "opacity-40 cursor-not-allowed hover:translate-y-0"
                      )}
                    >
                      {isActive && (
                        <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      {preset.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <span className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"
                      )}>
                        {preset.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {availableCount} models
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          
            {/* Search Bar */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "h-10 pl-10 pr-9 bg-[#F5F6FA] dark:bg-gray-800 border-none",
                    "rounded-[12px] text-sm placeholder:text-[#6F7287] dark:placeholder:text-gray-500",
                    "shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]",
                    "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
                    "transition-all duration-200"
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-300/30 hover:bg-gray-300/50 text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          
            {/* Models List */}
            <div className="px-6 pb-4">
              <div className="space-y-3">
                {/* Favorites Section */}
                {favoriteModels.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Favorites
                      </span>
                    </div>
                    
                    <div className="space-y-1">
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
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Recently Used
                      </span>
                    </div>
                    
                    <div className="space-y-1">
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
                  <div key={provider} className="space-y-1.5">
                    {/* Provider Label - only show if grouping by provider */}
                    {sortBy === 'provider' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Cpu className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          {provider}
                        </span>
                      </div>
                    )}
                    
                    {/* Models in this provider */}
                    <div className="space-y-1">
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
          
          {/* Sticky Footer - Fixed at Bottom */}
          <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
            {/* Selected Model Pills */}
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {values.slice(0, 4).map((model) => (
                  <button
                    key={model}
                    onClick={() => handleToggle(model)}
                    className="group flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-[10px] font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200"
                  >
                    <span className="truncate max-w-[80px]">{model}</span>
                    <X className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                  </button>
                ))}
                {values.length > 4 && (
                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md text-[10px] font-medium">
                    +{values.length - 4}
                  </span>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 h-8 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-semibold text-[12px]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  toast.success(`${values.length} model${values.length > 1 ? 's' : ''} selected`);
                }}
                className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[12px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Apply {values.length > 0 && `(${values.length})`}
              </Button>
            </div>
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
  const provider = getModelProvider(model);
  
  const modelButton = (
    <div className="relative group">
      <button
        onClick={() => onToggle(model)}
        disabled={isDisabled}
        className={cn(
          "w-full flex items-center gap-3 px-3 h-14 rounded-lg transition-all duration-200",
          "border-[1.5px]",
          isSelected 
            ? "bg-[#F0F5FF] dark:bg-blue-900/20 border-[#5B9FFF]" 
            : "bg-white dark:bg-gray-800 border-[#E5E7EB] dark:border-gray-700",
          !isSelected && "hover:bg-[#F9FAFB] dark:hover:bg-gray-750 hover:border-[#E5E7EB]",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0">
          <Checkbox 
            checked={isSelected} 
            className={cn(
              "w-5 h-5 rounded-md transition-all duration-200 border-2",
              isSelected && "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            )}
          />
        </div>
        
        {/* Model Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-sm font-semibold truncate",
              isSelected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"
            )}>
              {model}
            </span>
            
            {/* Badges */}
            <div className="flex items-center gap-1">
              {tier === 'premium' && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded">
                  PREMIUM
                </span>
              )}
              {tier === 'pro' && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded">
                  PRO
                </span>
              )}
              {tier === 'budget' && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-green-500 to-green-700 text-white rounded">
                  BUDGET
                </span>
              )}
              {speed === 'ultrafast' && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" />
                  FAST
                </span>
              )}
              {speed === 'fast' && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-500 text-white rounded">
                  FAST
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
            "flex-shrink-0 transition-all duration-200",
            isFavorite ? "text-amber-500 scale-110" : "text-gray-300 dark:text-gray-600 hover:text-amber-400"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("w-4 h-4", isFavorite && "fill-amber-500")} />
        </button>
        
        {/* Info Icon */}
        {info && (
          <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
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
