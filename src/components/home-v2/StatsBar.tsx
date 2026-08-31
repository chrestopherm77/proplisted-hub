export interface Stat {
  label: string;
  value: string;
}

export function StatsBar({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;
  return (
    <section className="bg-foreground text-background py-10">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl md:text-4xl font-bold text-primary">{s.value}</p>
            <p className="text-xs md:text-sm uppercase tracking-wider opacity-80 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
