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
    <ul className="w-full space-y-1 text-sm text-gray-600">
      {stages.map((stage, index) => (
        <li key={`${stage.stage}-${index}`}>
          <span className="font-medium">[{STAGE_LABEL[stage.stage]}]</span> {stage.message}
        </li>
      ))}
    </ul>
  );
}
