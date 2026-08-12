import { PageHeader } from "./PageHeader";
import type { AdminRouteMeta } from "./navigationModel";

type PlaceholderPageProps = Pick<AdminRouteMeta, "title">;

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="hsas-placeholder-page">
      <PageHeader title={title} />
      <div className="hsas-placeholder-page__body" aria-label={`${title} 화면`} />
    </section>
  );
}
