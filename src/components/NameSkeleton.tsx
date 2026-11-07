const WIDTHS = ["62%", "48%", "70%", "55%", "66%", "44%", "58%", "51%"];

export default function NameSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul aria-hidden="true" className="grid gap-0">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center px-4 py-3.5 sm:px-3">
          <div
            className="h-6 rounded-md bg-sunk motion-safe:animate-pulse"
            style={{ width: WIDTHS[i % WIDTHS.length] }}
          />
        </li>
      ))}
    </ul>
  );
}
