// Shared decorative background for the public marketing pages (home, contact, about) — a soft dot
// grid plus two glows (brand blue + warm amber) so the dark theme reads as considered, not empty.
// Pure CSS, no images: cheap, and it never fights page content since it's `-z-10` and `inset-0`.
export function PageBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgba(124,166,232,0.14) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full opacity-30 blur-3xl motion-safe:animate-[blob-float_11s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(61,111,196,0.55), transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full opacity-25 blur-3xl motion-safe:animate-[blob-float_14s_ease-in-out_infinite_1.5s]"
        style={{ background: "radial-gradient(circle, rgba(216,160,92,0.45), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] rounded-full opacity-20 blur-3xl motion-safe:animate-[blob-float_9s_ease-in-out_infinite_0.7s]"
        style={{ background: "radial-gradient(circle, rgba(124,166,232,0.35), transparent 70%)" }}
      />
    </div>
  );
}
