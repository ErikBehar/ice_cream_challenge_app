import { formatLastUpdated } from "@/lib/format";
import { GearIcon, IceCreamMark } from "./icons";

export function SiteHeader({
  lastUpdated,
  donationUrl,
}: {
  lastUpdated: string;
  donationUrl: string;
}) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-strawberry via-[#f08aa0] to-mint shadow-md">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -bottom-12 left-20 h-32 w-32 rounded-full bg-chocolate/10" />
      <div className="relative mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-6 sm:gap-4 sm:px-6 sm:py-8">
        <div className="flex min-w-0 items-start gap-3">
          <IceCreamMark className="mt-0.5 h-12 w-12 shrink-0 drop-shadow-sm sm:h-14 sm:w-14" />
          <div className="min-w-0">
            <h1 className="font-display text-2xl leading-tight text-white drop-shadow-sm sm:text-4xl">
              Escondido PTA Ice Cream Challenge 2026
            </h1>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Last updated {formatLastUpdated(lastUpdated)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-2 sm:gap-3">
          {donationUrl ? (
            <a
              href={donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="donate-sticker relative mt-0.5 max-w-[11.5rem] rotate-[-8deg] rounded-[1.5rem] border-[4px] border-white bg-[#F4D35E] px-3.5 py-3 text-center shadow-[4px_7px_0_rgba(92,58,33,0.28)] transition hover:rotate-[-3deg] hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:max-w-[16.5rem] sm:px-5 sm:py-4"
            >
              <span className="absolute -top-1.5 left-5 h-3.5 w-9 rotate-[-8deg] rounded-sm bg-white/70 shadow-sm" />
              <span className="font-display block text-base leading-tight text-chocolate sm:text-2xl">
                Click here to Donate!
              </span>
            </a>
          ) : null}
          <a
            href="/admin"
            className="shrink-0 rounded-full bg-white/20 p-2.5 text-white transition hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Admin settings"
            title="Admin"
          >
            <GearIcon className="h-6 w-6" />
          </a>
        </div>
      </div>
    </header>
  );
}
