import { TaskRunFloatingPanel } from "./TaskRunFloatingPanel";
import { resolveTaskRunPreview } from "./taskRunPreview";
import { useTaskRunPanel } from "./useTaskRunPanel";

interface TaskRunPanelHostProps {
  fallbackFocusId: string;
  isDevelopment?: boolean;
  pathname: string;
  search: string;
}

export function TaskRunPanelHost({
  fallbackFocusId,
  isDevelopment = import.meta.env.DEV,
  pathname,
  search,
}: TaskRunPanelHostProps) {
  const previewRuns = resolveTaskRunPreview(pathname, search, isDevelopment);
  const liveRuns = useTaskRunPanel({ enabled: previewRuns == null });
  const isPreview = previewRuns != null;

  return (
    <TaskRunFloatingPanel
      fallbackFocusId={fallbackFocusId}
      key={isPreview ? "preview" : "live"}
      runs={previewRuns ?? liveRuns}
    />
  );
}
