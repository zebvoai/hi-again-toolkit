import confetti from 'canvas-confetti';

// ========================================
// ZEBVO MICRO-INTERACTIONS LIBRARY
// Unified motion utilities aligned with design system
// ========================================

// Motion timing constants (matching CSS custom properties)
export const MOTION = {
  duration: {
    instant: 50,
    fast: 100,
    normal: 180,
    moderate: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
    snappy: 'cubic-bezier(0.2, 0, 0, 1)',
    expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

// Trigger haptic feedback on mobile devices
export const triggerHapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const durations = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(durations[intensity]);
  }
};

// Trigger success confetti celebration
export const triggerConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#5B9FFF', '#4A8FFF', '#3B7FEF'],
  });

  fire(0.2, {
    spread: 60,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#00CED1', '#20B2AA', '#48D1CC'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#FF69B4', '#FF1493', '#DB7093'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#9370DB', '#8A2BE2', '#7B68EE'],
  });
};

// Smooth scroll to element with motion-aware timing
export const smoothScrollTo = (element: HTMLElement | null, options?: { block?: ScrollLogicalPosition }) => {
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: options?.block ?? 'end',
    });
  }
};

// Update page title with status
export const updatePageTitle = (status: 'idle' | 'generating' | 'error' | 'success') => {
  const titles = {
    idle: 'Zebvo AI',
    generating: '✨ Generating... | Zebvo AI',
    error: '❌ Error | Zebvo AI',
    success: '✅ Ready | Zebvo AI',
  };
  document.title = titles[status];
};

// Apply entrance animation class temporarily
export const animateEntrance = (element: HTMLElement, type: 'fade' | 'scale' | 'slide' = 'fade') => {
  const animationClass = {
    fade: 'animate-fade-in',
    scale: 'animate-scale-in',
    slide: 'animate-slide-in-bottom',
  }[type];
  
  element.classList.add(animationClass);
  
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, MOTION.duration.moderate);
};

// Create staggered animation for children
export const staggerChildren = (container: HTMLElement, delayMs: number = 50) => {
  const children = Array.from(container.children) as HTMLElement[];
  children.forEach((child, index) => {
    child.style.animationDelay = `${index * delayMs}ms`;
    child.classList.add('appear-smooth');
  });
};
