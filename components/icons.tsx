export function IceCreamMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path d="M20 30c0-12 6-22 12-22s12 10 12 22H20Z" fill="#E85D75" />
      <path d="M18 30c2 8 8 12 14 12s12-4 14-12H18Z" fill="#5EC8B8" />
      <path d="M26 42h12l-4 16c-1 4-3 4-4 0L26 42Z" fill="#E8A87C" />
      <circle cx="28" cy="18" r="2.2" fill="#FFF8F0" />
      <circle cx="34" cy="14" r="1.6" fill="#FFF8F0" />
    </svg>
  );
}

export function StarMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#F4D35E">
      <path
        d="M12 2.4 14.6 8l6.2.7-4.6 4.2 1.3 6.1L12 16.2 6.5 19l1.3-6.1L3.2 8.7 9.4 8 12 2.4Z"
        stroke="#E8A87C"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScoopCone({
  className = "h-10 w-10",
  scoop = "#E85D75",
}: {
  className?: string;
  scoop?: string;
}) {
  return (
    <svg viewBox="0 0 48 64" className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="20" r="14" fill={scoop} />
      <circle cx="18" cy="14" r="2.2" fill="#FFF8F0" opacity="0.85" />
      <path d="M14 32h20L26 58c-1 3-3 3-4 0L14 32Z" fill="#E8A87C" />
      <path d="M16 38h16M18 46h12" stroke="#C9864E" strokeWidth="1.2" />
      <circle cx="24" cy="6" r="3.2" fill="#5EC8B8" />
    </svg>
  );
}

export function GearIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.5.42l-.36 2.54c-.59.22-1.14.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.8 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.92 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.31.6.22l2.39-.96c.49.4 1.04.72 1.63.94l.36 2.54c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.54c.59-.22 1.14-.54 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
    </svg>
  );
}
