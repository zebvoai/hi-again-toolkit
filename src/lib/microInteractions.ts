import confetti from 'canvas-confetti';

// Trigger haptic feedback on mobile devices
export const triggerHapticFeedback = (duration: number = 10) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
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

// Smooth scroll to element
export const smoothScrollTo = (element: HTMLElement | null) => {
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }
};

// Update page title
export const updatePageTitle = (status: 'idle' | 'generating' | 'error' | 'success') => {
  const titles = {
    idle: 'Zebvo AI',
    generating: '✨ Generating... | Zebvo AI',
    error: '❌ Error | Zebvo AI',
    success: '✅ Ready | Zebvo AI',
  };
  document.title = titles[status];
};
