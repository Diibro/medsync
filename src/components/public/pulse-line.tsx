// A continuously-scrolling ECG/heartbeat trace — the one visual cue that reads as "medical" at a
// glance. Built from two identical tiles side by side; translating the pair by -50% loops
// seamlessly since tile two picks up exactly where tile one started.
const CYCLE = "M0,20 L18,20 L22,20 L26,4 L30,36 L34,14 L38,20 L42,20 L60,20 L64,20 L68,8 L72,28 L76,20 L100,20";

export function PulseLine({
  className = "",
  color = "#3D6FC4",
  opacity = 0.35,
  duration = 7,
}: {
  className?: string;
  color?: string;
  opacity?: number;
  duration?: number;
}) {
  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} style={{ opacity }}>
      <svg
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        className="h-full w-[200%] motion-safe:animate-[ecg-scroll_linear_infinite]"
        style={{ animationDuration: `${duration}s` }}
      >
        <path d={CYCLE} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={CYCLE} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(100,0)" />
      </svg>
    </div>
  );
}
