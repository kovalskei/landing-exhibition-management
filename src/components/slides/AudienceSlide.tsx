export function AudienceSlide() {
  return (
    <div className="h-full w-full flex flex-col justify-center px-6 py-12 bg-background">
      <h2 className="font-heading font-bold text-3xl mb-8 gradient-border pb-3">Аудитория мероприятия</h2>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-primary">43%</div>
          <p className="text-sm flex-1">Руководители по персоналу, HR-директора, HRBP</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-secondary">36%</div>
          <p className="text-sm flex-1">ТОП-менеджмент, генеральные директора</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-accent">21%</div>
          <p className="text-sm flex-1">HR-специалисты, HR-менеджеры</p>
        </div>
      </div>
    </div>
  );
}
