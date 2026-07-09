import { STORE_NAME, STORE_TAGLINE } from "@/lib/branding";

interface StoreHeaderProps {
  className?: string;
  compact?: boolean;
}

export function StoreHeader({ className = "", compact = false }: StoreHeaderProps) {
  if (compact) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-[10px] uppercase tracking-[0.35em] text-gem-gold">
          {STORE_NAME}
        </p>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <p className="text-xs uppercase tracking-[0.35em] text-gem-gold">
        {STORE_NAME}
      </p>
      <p className="mt-1 text-sm text-gem-mist/50">{STORE_TAGLINE}</p>
    </div>
  );
}
