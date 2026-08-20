import { IceCreamMark, StarMark } from "./icons";

const COLORS = ["#E85D75", "#5EC8B8", "#E8A87C", "#F4D35E", "#FFF8F0", "#C4455C", "#7DCEC4"];

type BurstPiece = {
  id: string;
  tx: string;
  ty: string;
  size: number;
  round: boolean;
  color: string;
  delay: string;
  duration: string;
  spin: number;
};

function burstPieces(
  burstId: string,
  count: number,
  delayOffset: number,
): BurstPiece[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((index / count) * 360 + index * 11) * (Math.PI / 180);
    const distance = 70 + ((index * 37) % 90);
    const gravity = 30 + ((index * 13) % 50);
    return {
      id: `${burstId}-${index}`,
      tx: `${Math.cos(angle) * distance}px`,
      ty: `${Math.sin(angle) * distance + gravity}px`,
      size: 6 + (index % 5) * 2,
      round: index % 3 !== 1,
      color: COLORS[index % COLORS.length],
      delay: `${delayOffset + (index % 6) * 0.05}s`,
      duration: `${2.8 + (index % 4) * 0.25}s`,
      spin: index % 2 === 0 ? 1 : -1,
    };
  });
}

function Burst({
  className,
  pieces,
}: {
  className: string;
  pieces: BurstPiece[];
}) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-burst absolute left-0 top-0"
          style={{
            width: piece.size,
            height: piece.round ? piece.size : piece.size * 0.4,
            borderRadius: piece.round ? "999px" : "2px",
            background: piece.color,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            ["--tx" as string]: piece.tx,
            ["--ty" as string]: piece.ty,
            ["--spin" as string]: String(piece.spin),
          }}
        />
      ))}
    </div>
  );
}

export function ThankYouBanner() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-strawberry via-[#f4a261] to-mint px-4 py-8 text-center shadow-lg shadow-strawberry/25 ring-2 ring-white/50 sm:px-8 sm:py-10"
      aria-label="Thank you for reaching the fundraising goal"
    >
      <Burst className="left-[12%] top-[30%]" pieces={burstPieces("l", 18, 0)} />
      <Burst className="left-1/2 top-[22%]" pieces={burstPieces("c", 22, 0.35)} />
      <Burst className="left-[88%] top-[30%]" pieces={burstPieces("r", 18, 0.7)} />
      <Burst className="left-[30%] top-[70%]" pieces={burstPieces("bl", 14, 1.05)} />
      <Burst className="left-[70%] top-[70%]" pieces={burstPieces("br", 14, 1.4)} />

      <StarMark className="goal-star absolute top-4 left-6 h-7 w-7 sm:left-10" />
      <StarMark className="goal-star absolute top-6 right-8 h-6 w-6 [animation-delay:0.4s]" />
      <StarMark className="goal-star absolute bottom-5 left-1/4 h-5 w-5 [animation-delay:0.8s]" />
      <StarMark className="goal-star absolute right-[18%] bottom-6 h-7 w-7 [animation-delay:1.1s]" />

      <IceCreamMark className="scoop-bounce absolute top-5 left-[18%] hidden h-12 w-12 sm:block" />
      <IceCreamMark className="scoop-bounce absolute top-4 right-[16%] hidden h-12 w-12 [animation-delay:0.45s] sm:block" />

      <div className="relative z-10">
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/90">
          We did it, Escondido!
        </p>
        <p className="thank-you-pop font-display mt-2 text-5xl leading-none text-white drop-shadow-md sm:text-7xl md:text-8xl">
          THANK YOU!
        </p>
        <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-white/95 sm:text-lg">
          Families filled the school sundae. You made the Ice Cream Challenge a
          sweet success.
        </p>
      </div>
    </section>
  );
}
