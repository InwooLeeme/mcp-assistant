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
        className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-base disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-blue-600 px-5 py-2 text-white disabled:bg-gray-400"
      >
        전송
      </button>
    </form>
  );
}
