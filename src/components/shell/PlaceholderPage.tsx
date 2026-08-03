import type { AdminRouteMeta } from "../../app/navigation";
import { PageHeader } from "./PageHeader";

type PlaceholderPageProps = Pick<AdminRouteMeta, "title" | "screenCode">;

export function PlaceholderPage({ title, screenCode }: PlaceholderPageProps) {
  return (
    <section className="hsas-placeholder-page">
      <PageHeader title={title} screenCode={screenCode} />
      <div className="hsas-placeholder-page__body" aria-label={`${title} 화면`} />
    </section>
  );
}
