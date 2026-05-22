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
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2a679b] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[#f4f7fa]",
              isSelected
                ? "border-[#2a679b]/38 bg-[#eef6ff] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
                : "border-[#0d2b4f]/12 bg-white/72 text-slate-700 hover:bg-white",
              flash && isSelected && "border-[#c9963e]/70 bg-[#c9963e]/12"
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
            <span className="mt-0.5 block text-xs text-slate-500">
              {opt.description}
            </span>
          </label>
        );
      })}
    </div>
  );
}
