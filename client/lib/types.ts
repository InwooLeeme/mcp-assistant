export type StageName = "intent_analysis" | "planning" | "tool_call";

export type StageEvent = {
  type: "stage";
  stage: StageName;
  message: string;
};

export type ResultEvent = {
  type: "result";
  status: "success" | "fail";
  message: string;
  detail?: Record<string, unknown>;
};

export type CommandEvent = StageEvent | ResultEvent;

export type HistoryTurn = {
  command: string;
  status: "success" | "fail";
  message: string;
};

export type Conversation = {
  id: string;
  title: string;
  turns: HistoryTurn[];
  updatedAt: number;
};
