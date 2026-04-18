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
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
          font-weight: 900;
          font-size: clamp(36px, 7vw, 72px);
          letter-spacing: -0.02em;
          line-height: 1;
          opacity: 0;
          white-space: nowrap;
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
          padding: 0 clamp(10px, 2vw, 20px);
          flex-shrink: 0;
          position: relative;
          display: flex;
          align-items: center;
        }
        .pm-icon-svg {
          overflow: visible;
          width: clamp(60px, 10vw, 100px);
          height: clamp(24px, 4vw, 40px);
        }
        .pm-track {
          stroke-width: 3;
          stroke-linecap: round;
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
          50%      { opacity: 0.15; transform: scale(1.6); }
        }
      `}</style>

      <div className="pm-logo-wrap">
        <span className="pm-word pm-word-paper" style={{ color: 'var(--color-primary)' }}>Paper</span>
        <div className="pm-icon-wrap">
          <svg className="pm-icon-svg" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
            <line className="pm-track" x1="2" y1="20" x2="98" y2="20" style={{ stroke: 'var(--color-primary)' }} />
            <polygon className="pm-diamond-glow" points="50,4 66,20 50,36 34,20" style={{ fill: 'var(--color-primary)' }} />
            <polygon className="pm-diamond" points="50,4 66,20 50,36 34,20" style={{ fill: 'var(--color-primary)' }} />
          </svg>
        </div>
        <span className="pm-word pm-word-metrics" style={{ color: 'var(--color-primary)' }}>Metrics</span>
      </div>
    </div>
  )
}
