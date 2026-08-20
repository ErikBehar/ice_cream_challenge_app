import { formatLastUpdated } from "@/lib/format";
import { GearIcon, IceCreamMark } from "./icons";

export function SiteHeader({
  pageTitle,
  lastUpdated,
  donationUrl,
}: {
  pageTitle: string;
  lastUpdated: string;
  donationUrl: string;
}) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-strawberry via-[#f08aa0] to-mint shadow-md">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15" />
      <div className="pointer-events-none absolute -bottom-12 left-20 h-32 w-32 rounded-full bg-chocolate/10" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 px-4 py-6 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-4 sm:gap-y-0 sm:px-6 sm:py-8">
        <IceCreamMark className="col-start-1 row-start-1 mt-0.5 h-12 w-12 shrink-0 drop-shadow-sm sm:h-14 sm:w-14" />
        <h1 className="col-span-2 row-start-2 min-w-0 font-display text-2xl leading-tight text-white drop-shadow-sm sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:text-4xl">
          {pageTitle}
        </h1>
        <p className="col-start-1 row-start-3 min-w-0 self-center text-sm text-white/90 sm:col-start-2 sm:row-start-2 sm:mt-2 sm:self-start sm:text-base">
          Last updated {formatLastUpdated(lastUpdated)}
        </p>
        {donationUrl ? (
          <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="donate-sticker relative col-start-2 row-start-3 max-w-[9.5rem] rotate-[-8deg] justify-self-end self-center rounded-[1.5rem] border-[4px] border-white bg-[#F4D35E] px-3 py-2 text-center shadow-[4px_7px_0_rgba(92,58,33,0.28)] transition hover:rotate-[-3deg] hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:col-start-3 sm:row-span-2 sm:row-start-1 sm:mt-0.5 sm:max-w-[16.5rem] sm:self-start sm:px-5 sm:py-4"
          >
            <span className="absolute -top-1.5 left-5 h-3.5 w-9 rotate-[-8deg] rounded-sm bg-white/70 shadow-sm" />
            <span className="font-display block text-sm leading-tight text-chocolate sm:text-2xl">
              Click here to Donate!
            </span>
          </a>
        ) : null}
        <a
          href="/admin"
          className="col-start-2 row-start-1 shrink-0 justify-self-end rounded-full bg-white/20 p-2.5 text-white transition hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:col-start-4"
          aria-label="Admin settings"
          title="Admin"
        >
          <GearIcon className="h-6 w-6" />
        </a>
      </div>
    </header>
  );
}
