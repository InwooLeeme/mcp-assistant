import type { StageEvent } from "@/lib/types";

const STAGE_LABEL: Record<StageEvent["stage"], string> = {
  intent_analysis: "의도 분석",
  planning: "계획 수립",
  tool_call: "도구 호출",
};

type ProgressLogProps = {
  stages: StageEvent[];
};

export function ProgressLog({ stages }: ProgressLogProps) {
  if (stages.length === 0) return null;

  return (
    <ul className="mt-4 space-y-2.5 border-t border-border pt-4">
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        return (
          <li
            key={`${stage.stage}-${index}`}
            className="flex items-center gap-2.5 text-sm animate-fade-in-up"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                isLast ? "bg-accent animate-pulse" : "bg-muted/40"
              }`}
            />
            <span className="font-medium text-foreground">{STAGE_LABEL[stage.stage]}</span>
            <span className="text-muted">{stage.message}</span>
          </li>
        );
      })}
    </ul>
  );
}
