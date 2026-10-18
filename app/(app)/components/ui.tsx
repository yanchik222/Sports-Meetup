import { BallIcon } from "./icons";

// Shared layout pieces for SportMatch pages. Pages are a title followed by
// sections that sit directly on the background, separated by dividers.

// `collapsible` hides the wordmark while the sidebar is an icon rail.
export function Logo({ large, collapsible }: { large?: boolean; collapsible?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`grid shrink-0 place-items-center bg-brand-300 text-brand-900 ${
          large ? "size-10 rounded-xl" : "size-8 rounded-lg"
        }`}
      >
        <BallIcon className={large ? "size-6" : "size-5"} weight="bold" />
      </span>
      <span
        className={`font-display font-bold tracking-tight text-slate-900 ${large ? "text-2xl" : "text-lg"} ${
          collapsible ? "md:max-lg:hidden" : ""
        }`}
      >
        SportMatch
      </span>
    </span>
  );
}

// The page's content area. Layouts inside respond to its width (container
// queries), so they adapt to the sidebar as well as the window size.
export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="@container mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-12 lg:px-10 lg:pt-10">
      <header className="mb-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-slate-500">{description}</p>}
      </header>
      <div className="divide-y divide-slate-200/80">{children}</div>
    </main>
  );
}

// A group of related content. With `side`, the title and description sit in a
// left column next to the content once there's room for it.
export function Section({
  title,
  description,
  count,
  action,
  side,
  children,
}: {
  title?: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
  side?: boolean;
  children: React.ReactNode;
}) {
  const heading = title && (
    <div className={side ? "mb-4 @3xl:mb-0" : "mb-4 flex flex-wrap items-center justify-between gap-2"}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {!!count && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-900 tabular-nums">
              {count}
            </span>
          )}
        </div>
        {description && <p className="mt-1 max-w-prose text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );

  return (
    <section className={`py-7 ${side ? "@3xl:grid @3xl:grid-cols-[15rem_1fr] @3xl:gap-10" : ""}`}>
      {heading}
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">{children}</p>;
}

// Round badge with a player's initials.
export function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-900 ${
        small ? "size-9 text-xs" : "size-10 text-sm"
      }`}
    >
      {initials || "?"}
    </span>
  );
}
