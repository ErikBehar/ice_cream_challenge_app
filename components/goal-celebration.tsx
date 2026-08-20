import { ScoopCone, StarMark } from "./icons";

const CONFETTI_COLORS = ["#E85D75", "#5EC8B8", "#E8A87C", "#F4D35E", "#C4455C", "#FFF8F0"];
const SCOOP_COLORS = ["#E85D75", "#5EC8B8", "#C9864E"];

function seedNumber(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function GoalCelebration({
  seed,
  density = "normal",
  className = "rounded-2xl",
}: {
  seed: string;
  density?: "normal" | "festive";
  className?: string;
}) {
  const random = mulberry(seedNumber(seed) + 2026);
  const count = density === "festive" ? 28 : 16;
  const pieces = Array.from({ length: count }, (_, index) => {
    const size = 5 + random() * (density === "festive" ? 9 : 7);
    return {
      id: index,
      left: `${random() * 100}%`,
      delay: `${random() * 2.4}s`,
      duration: `${2.4 + random() * 2.2}s`,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      size,
      round: random() > 0.55,
      drift: `${(random() * 40 - 20).toFixed(1)}px`,
      spin: random() > 0.5 ? 1 : -1,
    };
  });
  const scoopIndex = seedNumber(seed);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute -top-3"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 0.45,
            borderRadius: piece.round ? "999px" : "2px",
            background: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            ["--drift" as string]: piece.drift,
            ["--spin" as string]: String(piece.spin),
          }}
        />
      ))}

      <StarMark className="goal-star absolute top-3 left-3 h-5 w-5" />
      <StarMark className="goal-star absolute top-10 right-8 h-4 w-4 [animation-delay:0.35s]" />
      <StarMark className="goal-star absolute bottom-12 left-6 h-4 w-4 [animation-delay:0.7s]" />
      <StarMark className="goal-star absolute right-4 bottom-6 h-5 w-5 [animation-delay:1.1s]" />
      {density === "festive" ? (
        <>
          <StarMark className="goal-star absolute top-4 left-1/3 h-6 w-6 [animation-delay:0.2s]" />
          <StarMark className="goal-star absolute top-6 right-1/3 h-5 w-5 [animation-delay:0.9s]" />
        </>
      ) : null}

      <ScoopCone
        className="scoop-bounce absolute top-12 right-3 h-12 w-9"
        scoop={SCOOP_COLORS[scoopIndex % SCOOP_COLORS.length]}
      />
      <ScoopCone
        className="scoop-bounce absolute bottom-3 right-14 h-9 w-7 [animation-delay:0.5s]"
        scoop={SCOOP_COLORS[(scoopIndex + 1) % SCOOP_COLORS.length]}
      />
      {density === "festive" ? (
        <ScoopCone
          className="scoop-bounce absolute bottom-4 left-8 h-11 w-8 [animation-delay:0.25s]"
          scoop={SCOOP_COLORS[(scoopIndex + 2) % SCOOP_COLORS.length]}
        />
      ) : null}
    </div>
  );
}
