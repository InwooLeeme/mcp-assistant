import type { ResultEvent } from "@/lib/types";

type ResultMessageProps = {
  result: ResultEvent | null;
  error: string | null;
};

export function ResultMessage({ result, error }: ResultMessageProps) {
  if (error) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger animate-fade-in-up">
        <span aria-hidden className="mt-px">
          ⚠
        </span>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) return null;

  const isSuccess = result.status === "success";

  return (
    <div
      className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in-up ${
        isSuccess
          ? "border-success-border bg-success-bg text-success"
          : "border-danger-border bg-danger-bg text-danger"
      }`}
    >
      <span aria-hidden className="mt-px">
        {isSuccess ? "✓" : "⚠"}
      </span>
      <p>{result.message}</p>
    </div>
  );
}
