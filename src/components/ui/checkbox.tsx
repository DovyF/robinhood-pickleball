import { cn } from "@/lib/utils";

interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-cream-dark bg-panel accent-forest-700 cursor-pointer transition",
        className
      )}
      {...props}
    />
  );
}
