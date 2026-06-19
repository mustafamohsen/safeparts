import { useId } from "react";

import { cn } from "../../lib/cn";

type Encoding = "base64url" | "mnemo-words";

type EncodingOption = {
  value: Encoding;
  label: string;
  description: string;
};

type EncodingSelectorProps = {
  value: Encoding;
  onChange: (value: Encoding) => void;
  options: EncodingOption[];
  flash?: boolean;
};

export type { Encoding, EncodingOption };

export function EncodingSelector({
  value,
  onChange,
  options,
  flash,
}: EncodingSelectorProps) {
  const groupId = useId();

  return (
    <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const optionId = `${groupId}-${opt.value}`;

        return (
          <label
            key={opt.value}
            htmlFor={optionId}
            className={cn(
              "cursor-pointer rounded-xl border px-3 py-2.5 text-start transition-colors duration-200",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-400 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-black",
              isSelected
                ? "border-emerald-500/40 bg-emerald-500/10 text-slate-100"
                : "border-emerald-500/15 bg-black/40 text-slate-300 hover:bg-black/60",
              flash && isSelected && "border-emerald-300/70 bg-emerald-500/20"
            )}
          >
            <input
              type="radio"
              id={optionId}
              name={groupId}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="block text-sm font-medium">{opt.label}</span>
            <span className="mt-0.5 block text-xs text-slate-400">
              {opt.description}
            </span>
          </label>
        );
      })}
    </div>
  );
}
