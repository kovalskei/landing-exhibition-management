export function HeroSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-center items-start px-6 py-12 bg-gradient-to-br from-background via-background to-primary/10">
      <p className="text-gold text-sm font-semibold tracking-wider mb-4">20 НОЯБРЯ 2025</p>
      <h1 className="font-heading font-bold text-4xl leading-tight mb-6">
        МАСШТАБНАЯ <br />
        КОНФЕРЕНЦИЯ <br />
        И ВЫСТАВКА
      </h1>
      <div className="gradient-border pb-4 mb-6 w-full" />
      <div className="space-y-2 text-lg">
        <p className="font-semibold">70 ЭКСПОНЕНТОВ</p>
        <p className="font-semibold">70 СПИКЕРОВ</p>
        <p className="font-semibold">1200 ПОСЕТИТЕЛЕЙ</p>
      </div>
    </div>
  );
}
