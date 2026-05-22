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
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#bfe7ff] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[#05060a]",
              isSelected
                ? "border-[#bfe7ff]/40 bg-[#60a5fa]/10 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "border-[#bfe7ff]/15 bg-[#050b14]/70 text-slate-300 hover:bg-white/[0.055]",
              flash && isSelected && "border-[#f6c979]/70 bg-[#f6c979]/15"
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
