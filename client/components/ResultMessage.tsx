import type { ResultEvent } from "@/lib/types";

type ResultMessageProps = {
  result: ResultEvent | null;
  error: string | null;
};

export function ResultMessage({ result, error }: ResultMessageProps) {
  if (error) {
    return <p className="w-full rounded-md bg-red-50 px-4 py-3 text-red-700">{error}</p>;
  }

  if (!result) return null;

  const isSuccess = result.status === "success";

  return (
    <p
      className={
        isSuccess
          ? "w-full rounded-md bg-green-50 px-4 py-3 text-green-700"
          : "w-full rounded-md bg-red-50 px-4 py-3 text-red-700"
      }
    >
      {result.message}
    </p>
  );
}
