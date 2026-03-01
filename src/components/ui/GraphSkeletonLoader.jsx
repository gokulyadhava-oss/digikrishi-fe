import { useEffect, useState } from "react";

const GREEN = {
  bg: "#0a1a0f",
  card: "#0d1f12",
  border: "#1a3a22",
  dark: "#0f2a16",
  mid: "#1a4025",
  shimmer1: "#1f4d2c",
  shimmer2: "#2d7a42",
  glow: "rgba(45,122,66,0.15)",
};

function Shimmer({ width = "100%", height = 12, radius = 6, delay = 0, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(90deg, ${GREEN.dark} 25%, ${GREEN.shimmer1} 50%, ${GREEN.mid} 60%, ${GREEN.dark} 75%)`,
      backgroundSize: "400% 100%",
      animation: `shimmer 1.8s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      ...style,
    }} />
  );
}

// Bar chart skeleton
function BarChartSkeleton() {
  const bars = [65, 40, 80, 55, 90, 45, 70, 60, 85, 50, 75, 55];
  return (
    <div style={{ padding: "24px", background: GREEN.card, borderRadius: "16px", border: `1px solid ${GREEN.border}` }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Shimmer width="140px" height={14} radius={4} delay={0} />
          <Shimmer width="80px" height={10} radius={4} delay={0.1} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Shimmer width="60px" height={28} radius={8} delay={0.2} />
          <Shimmer width="60px" height={28} radius={8} delay={0.3} />
        </div>
      </div>

      {/* Y-axis labels */}
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingBottom: "28px", gap: "0" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Shimmer key={i} width="28px" height={8} radius={3} delay={i * 0.05} />
          ))}
        </div>

        {/* Bars area */}
        <div style={{ flex: 1 }}>
          {/* Grid lines */}
          <div style={{ position: "relative", height: "140px", marginBottom: "8px" }}>
            {[0, 25, 50, 75, 100].map((p, i) => (
              <div key={i} style={{
                position: "absolute", left: 0, right: 0,
                bottom: `${p}%`, height: "1px",
                background: `rgba(45,122,66,0.1)`,
              }} />
            ))}
            {/* Bars */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100%", position: "relative", zIndex: 1 }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`,
                  background: `linear-gradient(180deg, ${GREEN.shimmer2} 0%, ${GREEN.shimmer1} 50%, ${GREEN.dark} 100%)`,
                  borderRadius: "4px 4px 2px 2px",
                  animation: `barPulse 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                  boxShadow: `0 0 8px rgba(45,122,66,0.2)`,
                }} />
              ))}
            </div>
          </div>
          {/* X labels */}
          <div style={{ display: "flex", gap: "6px" }}>
            {bars.map((_, i) => (
              <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <Shimmer width="100%" height={8} radius={3} delay={i * 0.06} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Line chart skeleton
function LineChartSkeleton() {
  return (
    <div style={{ padding: "24px", background: GREEN.card, borderRadius: "16px", border: `1px solid ${GREEN.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Shimmer width="120px" height={14} radius={4} />
          <Shimmer width="70px" height={10} radius={4} delay={0.1} />
        </div>
        <Shimmer width="80px" height={32} radius={8} delay={0.2} />
      </div>

      {/* SVG line skeleton */}
      <div style={{ position: "relative", height: "120px", marginBottom: "8px" }}>
        {/* Grid lines */}
        {[0, 33, 66, 100].map((p, i) => (
          <div key={i} style={{
            position: "absolute", left: 0, right: 0,
            top: `${p}%`, height: "1px",
            background: "rgba(45,122,66,0.1)",
          }} />
        ))}

        {/* Animated SVG line */}
        <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={GREEN.dark} />
              <stop offset="40%" stopColor={GREEN.shimmer1}>
                <animate attributeName="offset" values="0;0.4;1" dur="1.8s" repeatCount="indefinite" />
              </stop>
              <stop offset="60%" stopColor={GREEN.shimmer2}>
                <animate attributeName="offset" values="0.2;0.6;1.2" dur="1.8s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor={GREEN.dark} />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={GREEN.shimmer1} stopOpacity="0.3" />
              <stop offset="100%" stopColor={GREEN.dark} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <path
            d="M0,80 C40,70 80,40 120,55 C160,70 200,30 240,45 C280,60 320,25 360,40 L400,35 L400,120 L0,120 Z"
            fill="url(#areaGrad)"
            style={{ animation: "areaPulse 2s ease-in-out infinite" }}
          />
          {/* Line */}
          <path
            d="M0,80 C40,70 80,40 120,55 C160,70 200,30 240,45 C280,60 320,25 360,40 L400,35"
            fill="none" stroke="url(#lineGrad)" strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Dots */}
          {[[0,80],[120,55],[240,45],[400,35]].map(([x,y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={GREEN.shimmer2}
              style={{ animation: `dotPulse 2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </svg>
      </div>

      {/* X labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {[0,1,2,3,4,5].map(i => (
          <Shimmer key={i} width="36px" height={8} radius={3} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

// Donut skeleton
function DonutSkeleton() {
  return (
    <div style={{ padding: "24px", background: GREEN.card, borderRadius: "16px", border: `1px solid ${GREEN.border}` }}>
      <div style={{ marginBottom: "20px" }}>
        <Shimmer width="100px" height={14} radius={4} />
        <div style={{ marginTop: "8px" }}>
          <Shimmer width="60px" height={10} radius={4} delay={0.1} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* Donut */}
        <div style={{ position: "relative", width: "110px", height: "110px", flexShrink: 0 }}>
          <svg width="110" height="110" viewBox="0 0 110 110">
            <defs>
              <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={GREEN.shimmer1} />
                <stop offset="100%" stopColor={GREEN.shimmer2} />
              </linearGradient>
            </defs>
            {/* BG ring */}
            <circle cx="55" cy="55" r="40" fill="none" stroke={GREEN.dark} strokeWidth="16" />
            {/* Animated arc */}
            <circle cx="55" cy="55" r="40" fill="none"
              stroke="url(#donutGrad)" strokeWidth="16"
              strokeDasharray="180 251"
              strokeDashoffset="63"
              strokeLinecap="round"
              transform="rotate(-90 55 55)"
              style={{ animation: "donutSpin 2s ease-in-out infinite" }}
            />
            {/* Inner glow circle */}
            <circle cx="55" cy="55" r="28" fill={GREEN.bg}
              style={{ filter: `drop-shadow(0 0 6px ${GREEN.glow})` }}
            />
          </svg>
          {/* Center shimmer */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          }}>
            <Shimmer width="32px" height={14} radius={3} />
            <Shimmer width="22px" height={8} radius={3} delay={0.1} />
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "10px", height: "10px", borderRadius: "3px",
                background: GREEN.shimmer1,
                animation: `dotPulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }} />
              <Shimmer width={`${60 + i * 15}px`} height={10} radius={3} delay={i * 0.1} />
              <div style={{ marginLeft: "auto" }}>
                <Shimmer width="28px" height={10} radius={3} delay={i * 0.12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stat cards row
function StatCardsSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
      {[0.0, 0.15, 0.3].map((delay, i) => (
        <div key={i} style={{
          padding: "18px", background: GREEN.card, borderRadius: "14px",
          border: `1px solid ${GREEN.border}`,
          boxShadow: `0 0 20px ${GREEN.glow}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
            <Shimmer width="36px" height={36} radius={10} delay={delay} />
            <Shimmer width="48px" height={18} radius={20} delay={delay + 0.1} />
          </div>
          <Shimmer width="70%" height={22} radius={4} delay={delay + 0.05} style={{ marginBottom: "6px" }} />
          <Shimmer width="50%" height={10} radius={4} delay={delay + 0.1} />
        </div>
      ))}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function GraphSkeletonLoader() {
  const [loaded, setLoaded] = useState(false);
  const [key, setKey] = useState(0);

  const reset = () => { setLoaded(false); setKey(k => k + 1); };
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 3500);
    return () => clearTimeout(t);
  }, [key]);

  return (
    <div style={{
      minHeight: "100vh", background: GREEN.bg,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 20px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(45,122,66,0.12)", border: "1px solid rgba(45,122,66,0.3)",
          borderRadius: "20px", padding: "6px 14px", marginBottom: "12px",
        }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2d7a42", animation: "dotPulse 1.2s ease-in-out infinite" }} />
          <span style={{ fontSize: "12px", color: "#2d7a42", fontWeight: "600", letterSpacing: "0.08em" }}>
            {loaded ? "DATA LOADED" : "LOADING DATA"}
          </span>
        </div>
        <h1 style={{ color: "#c8f0d0", fontSize: "22px", fontWeight: "700", margin: 0 }}>
          Analytics Dashboard
        </h1>
        <p style={{ color: "#3a6b47", fontSize: "13px", marginTop: "4px" }}>
          {loaded ? "All charts ready" : "Fetching your graph data..."}
        </p>
      </div>

      {/* Dashboard grid */}
      {!loaded ? (
        <div style={{ width: "100%", maxWidth: "700px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <StatCardsSkeleton />
          <BarChartSkeleton />
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
            <LineChartSkeleton />
            <DonutSkeleton />
          </div>
        </div>
      ) : (
        <div style={{
          width: "100%", maxWidth: "700px",
          background: GREEN.card, border: `1px solid ${GREEN.border}`,
          borderRadius: "16px", padding: "40px",
          textAlign: "center",
          boxShadow: `0 0 40px rgba(45,122,66,0.15)`,
        }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📊</div>
          <div style={{ color: "#c8f0d0", fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
            Charts Loaded!
          </div>
          <div style={{ color: "#3a6b47", fontSize: "13px", marginBottom: "24px" }}>
            Real data would render here
          </div>
          <button onClick={reset} style={{
            padding: "12px 28px", background: "#2d7a42",
            border: "none", borderRadius: "10px", color: "#fff",
            fontWeight: "700", fontSize: "13px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 16px rgba(45,122,66,0.4)",
          }}>
            ↺ Replay Skeleton
          </button>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 100% 0 }
          100% { background-position: -100% 0 }
        }
        @keyframes barPulse {
          0%, 100% { opacity: 0.6 }
          50%       { opacity: 1 }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95) }
          50%       { opacity: 1;   transform: scale(1.05) }
        }
        @keyframes donutSpin {
          0%   { stroke-dashoffset: 63;  opacity: 0.5 }
          50%  { stroke-dashoffset: -63; opacity: 1   }
          100% { stroke-dashoffset: 63;  opacity: 0.5 }
        }
        @keyframes areaPulse {
          0%, 100% { opacity: 0.4 }
          50%       { opacity: 0.9 }
        }
      `}</style>
    </div>
  );
}
