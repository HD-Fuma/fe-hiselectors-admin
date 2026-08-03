export interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="hsas-empty-state">
      <h3 className="hsas-empty-state__title">{title}</h3>
      {description ? <p className="hsas-empty-state__description">{description}</p> : null}
    </div>
  );
}
