import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

/**
 * Placeholder — the single empty-state page used by every stub CRM route while
 * the rebuild is in progress. Renders a frosted Croat card with the section
 * title and a "в разработке" note.
 */
export function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Раздел в разработке</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] leading-relaxed text-white/50">
            Здесь появится модуль «{title}». Каркас на дизайн-ките Croat готов —
            наполнение придёт на следующих фазах после подключения Supabase и CRM-схемы.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
