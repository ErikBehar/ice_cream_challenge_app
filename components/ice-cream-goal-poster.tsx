import {
  ICE_CREAM_POSTER,
  ICE_CREAM_SCOOPS,
  SCOOP_COUNT,
  SCOOP_DOLLAR_STEP,
  SCOOP_FLAVORS,
  filledScoopCount,
} from "@/lib/ice-cream-poster";
import { formatMoney } from "@/lib/format";

export function IceCreamGoalPoster({ overallRaised }: { overallRaised: number }) {
  const filled = filledScoopCount(overallRaised);
  const nextAt = filled < SCOOP_COUNT ? (filled + 1) * SCOOP_DOLLAR_STEP : null;

  return (
    <figure className="mx-auto w-full max-w-md">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-cream-dark">
        {/* Poster is a static public asset; overlay SVG uses the same pixel viewBox. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ice-cream-poster.png"
          alt="Escondido Ice Cream Challenge cone with 27 scoops of $5,000 each"
          width={ICE_CREAM_POSTER.width}
          height={ICE_CREAM_POSTER.height}
          className="block h-auto w-full"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${ICE_CREAM_POSTER.width} ${ICE_CREAM_POSTER.height}`}
          aria-hidden="true"
        >
          {ICE_CREAM_SCOOPS.slice(0, filled).map((scoop, index) => (
            <g
              key={`${scoop.x}-${scoop.y}`}
              className="scoop-fill"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <circle
                cx={scoop.x}
                cy={scoop.y}
                r={scoop.r}
                fill={SCOOP_FLAVORS[index]}
              />
              <ellipse
                cx={scoop.x - scoop.r * 0.28}
                cy={scoop.y - scoop.r * 0.34}
                rx={scoop.r * 0.32}
                ry={scoop.r * 0.2}
                fill="#fff"
                opacity="0.42"
              />
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-sm text-chocolate/65">
        {filled} of {SCOOP_COUNT} scoops filled
        {nextAt
          ? ` · next scoop at ${formatMoney(nextAt)}`
          : " · the cone is full"}
      </figcaption>
    </figure>
  );
}
