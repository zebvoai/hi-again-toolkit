import { useEffect, useState } from 'react';

const PremiumLoader = () => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Simulate smooth progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Fast start, slow middle, fast finish
        const increment = prev < 30 ? 4 : prev < 70 ? 2 : prev < 90 ? 3 : 5;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => setFadeOut(true), 200);
      return () => clearTimeout(timeout);
    }
  }, [progress]);

  return (
    <div
      className={`premium-loader ${fadeOut ? 'premium-loader--exit' : ''}`}
      role="status"
      aria-label="Loading Zebvo AI"
    >
      {/* Ambient background glow */}
      <div className="premium-loader__ambient" />

      {/* Floating orbs */}
      <div className="premium-loader__orb premium-loader__orb--1" />
      <div className="premium-loader__orb premium-loader__orb--2" />
      <div className="premium-loader__orb premium-loader__orb--3" />

      {/* Center content */}
      <div className="premium-loader__content">
        {/* Logo mark */}
        <div className="premium-loader__logo">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            className="premium-loader__logo-svg"
          >
            {/* Z letterform */}
            <path
              d="M12 14h24l-24 20h24"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="premium-loader__z-path"
            />
          </svg>
        </div>

        {/* Brand name */}
        <div className="premium-loader__brand">
          <span className="premium-loader__brand-text">Zebvo AI</span>
        </div>

        {/* Progress bar */}
        <div className="premium-loader__progress-track">
          <div
            className="premium-loader__progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div
            className="premium-loader__progress-glow"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;
