import { cn } from "../lib/cn";

type ClearButtonVariant = "x" | "eraser";

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 16 13 7a2 2 0 0 1 2.83 0l4.17 4.17a2 2 0 0 1 0 2.83L14.83 19H8a2 2 0 0 1-1.41-.59L4 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14.83 19H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type ClearButtonProps = {
  label: string;
  variant?: ClearButtonVariant;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function ClearButton({
  label,
  variant = "eraser",
  disabled = false,
  onClick,
  className,
}: ClearButtonProps) {
  const Icon = variant === "x" ? XIcon : EraserIcon;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        "h-9 w-9",
        "text-slate-400 hover:text-slate-200",
        "bg-transparent hover:bg-white/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400",
        className,
      )}
    >
      <Icon />
      <span className="sr-only">{label}</span>
    </button>
  );
}
