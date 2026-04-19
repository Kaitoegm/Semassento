import { useState, useEffect } from 'react'

export default function LoadingScreen({ onFinish }) {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setVisible(false)
        onFinish?.()
      }, 500)
    }, 3800)
    return () => clearTimeout(timer)
  }, [onFinish])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'var(--background)' }}
    >
      <style>{`
        .pm-logo-wrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0;
        }
        .pm-word {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-weight: 600;
          font-size: clamp(36px, 7vw, 64px);
          letter-spacing: -1.5px;
          line-height: 1;
          opacity: 0;
          white-space: nowrap;
          color: var(--color-primary);
        }
        .pm-word-paper {
          animation: pmFadeSlideL 0.45s cubic-bezier(0.22,1,0.36,1) 2.8s forwards;
          transform: translateX(-16px);
        }
        .pm-word-metrics {
          animation: pmFadeSlideR 0.45s cubic-bezier(0.22,1,0.36,1) 3.0s forwards;
          transform: translateX(16px);
        }
        @keyframes pmFadeSlideL { to { opacity: 1; transform: translateX(0); } }
        @keyframes pmFadeSlideR { to { opacity: 1; transform: translateX(0); } }

        .pm-icon-wrap {
          padding: 0 clamp(10px, 2vw, 28px);
          flex-shrink: 0;
          position: relative;
          display: flex;
          align-items: center;
        }
        .pm-icon-svg {
          overflow: visible;
          width: clamp(50px, 8vw, 80px);
          height: clamp(24px, 4vw, 40px);
          color: var(--color-primary);
        }
        .pm-track {
          opacity: 0;
          animation: pmFadeIn 0.3s ease 0.1s forwards;
        }
        @keyframes pmFadeIn { to { opacity: 1; } }

        .pm-diamond {
          animation: pmSlide 2.3s cubic-bezier(0.45,0,0.55,1) 0.4s forwards;
          transform: translateX(-48px);
        }
        @keyframes pmSlide {
          0%   { transform: translateX(-48px); }
          35%  { transform: translateX(48px); }
          65%  { transform: translateX(-20px); }
          82%  { transform: translateX(14px); }
          92%  { transform: translateX(-4px); }
          100% { transform: translateX(0px); }
        }

        .pm-diamond-glow {
          opacity: 0;
          transform-origin: 50px 20px;
          animation: pmGlowPulse 2.2s ease-in-out 3.2s infinite;
        }
        @keyframes pmGlowPulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50%      { opacity: 0.12; transform: scale(1.4); }
        }
      `}</style>

      <div className="pm-logo-wrap">
        <span className="pm-word pm-word-paper">Paper</span>
        <div className="pm-icon-wrap">
          <svg className="pm-icon-svg" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
            <rect className="pm-track" x="2" y="18" width="96" height="4" fill="currentColor" />
            <polygon className="pm-diamond-glow" points="50,2 68,20 50,38 32,20" fill="currentColor" />
            <polygon className="pm-diamond" points="50,2 68,20 50,38 32,20" fill="currentColor" />
          </svg>
        </div>
        <span className="pm-word pm-word-metrics">Metrics</span>
      </div>
    </div>
  )
}
