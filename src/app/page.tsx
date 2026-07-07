import Link from "next/link";

const steps = [
  {
    step: 1,
    role: "Customer",
    device: "Phone",
    href: "/customize",
    action: "Tap stones → Finalize Layout",
    note: "Keep the order code screen open",
    primary: true,
  },
  {
    step: 2,
    role: "Cashier",
    device: "Laptop / iPad",
    href: "/pos",
    action: "Order appears → Mark Paid & Send to Studio",
    note: "Open this tab before step 1 and leave it open",
    primary: false,
  },
  {
    step: 3,
    role: "Studio",
    device: "Laptop",
    href: "/admin",
    action: "Read assembly script → Mark Complete",
    note: "Order shows after cashier marks paid",
    primary: false,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gem-ink px-6 py-10">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
            GemOps
          </p>
          <h1 className="mt-3 font-display text-4xl text-gem-mist">
            Phygital Studio
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gem-mist/60">
            Custom jewelry — designed in-store, built in studio.
          </p>
        </div>

        <Link
          href="/demo"
          className="mt-8 block rounded-xl border border-gem-gold/50 bg-gem-gold/10 p-5 text-center transition hover:border-gem-gold"
        >
          <p className="text-xs uppercase tracking-wider text-gem-gold">
            Easiest way to try it
          </p>
          <p className="mt-1 text-lg font-medium text-gem-mist">
            Solo demo — one screen, one click
          </p>
          <p className="mt-1 text-sm text-gem-mist/50">
            Full flow without a second device
          </p>
        </Link>

        <p className="mt-8 text-center text-xs uppercase tracking-wider text-gem-mist/40">
          Or run the real 3-screen flow
        </p>

        <ol className="mt-4 space-y-4">
          {steps.map((item) => (
            <li key={item.step}>
              <Link
                href={item.href}
                className={`block rounded-xl border p-5 transition ${
                  item.primary
                    ? "border-gem-gold/50 bg-gem-gold/5 hover:border-gem-gold"
                    : "border-white/10 bg-gem-slate hover:border-white/25"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      item.primary
                        ? "bg-gem-gold text-gem-ink"
                        : "bg-white/10 text-gem-mist"
                    }`}
                  >
                    {item.step}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gem-mist/50">
                      {item.role} · {item.device}
                    </p>
                    <p className="mt-1 font-medium text-gem-mist">
                      {item.action}
                    </p>
                    <p className="mt-1 text-sm text-gem-mist/50">{item.note}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
