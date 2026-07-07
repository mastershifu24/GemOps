import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gem-ink px-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">GemOps</p>
        <h1 className="mt-3 font-display text-4xl text-gem-mist">Phygital Studio</h1>
        <p className="mt-2 text-sm text-gem-mist/60">MVP — choose your workspace</p>
      </div>

      <nav className="flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/customize"
          className="rounded-xl border border-gem-gold/40 bg-gem-slate px-6 py-4 text-center text-gem-mist transition hover:border-gem-gold"
        >
          Customer Customizer
        </Link>
        <Link
          href="/pos"
          className="rounded-xl border border-white/10 bg-gem-slate px-6 py-4 text-center text-gem-mist/80 transition hover:border-white/25"
        >
          Retailer POS
        </Link>
        <Link
          href="/admin"
          className="rounded-xl border border-white/10 bg-gem-slate px-6 py-4 text-center text-gem-mist/80 transition hover:border-white/25"
        >
          GemOps Admin
        </Link>
      </nav>
    </main>
  );
}
