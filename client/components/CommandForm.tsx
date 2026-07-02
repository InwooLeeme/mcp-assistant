"use client";

import { FormEvent, useState } from "react";

type CommandFormProps = {
  onSubmit: (text: string) => void;
  disabled?: boolean;
};

export function CommandForm({ onSubmit, disabled }: CommandFormProps) {
  const [text, setText] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="명령을 입력해 주세요"
        disabled={disabled}
        className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl bg-accent px-5 py-3 font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        전송
      </button>
    </form>
  );
}
