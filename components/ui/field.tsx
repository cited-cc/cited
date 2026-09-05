import { cn } from "@/lib/utils";

type FieldLabelProps = {
  htmlFor?: string;
  children: React.ReactNode;
  optional?: boolean;
  className?: string;
};

export function FieldLabel({
  htmlFor,
  children,
  optional,
  className,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "mb-1.5 block text-sm font-medium text-cited-ink",
        className,
      )}
    >
      {children}
      {optional ? (
        <span className="ml-1.5 font-normal text-cited-ink-faint">(optional)</span>
      ) : null}
    </label>
  );
}

type FieldDescriptionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function FieldDescription({
  children,
  className,
  id,
}: FieldDescriptionProps) {
  return (
    <p id={id} className={cn("mt-1.5 type-body-sm text-cited-ink-subtle", className)}>
      {children}
    </p>
  );
}

type FieldErrorProps = {
  children?: React.ReactNode;
  className?: string;
  id?: string;
};

export function FieldError({ children, className, id }: FieldErrorProps) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-1.5 text-xs text-cited-danger", className)}
    >
      {children}
    </p>
  );
}

type FormFieldProps = {
  children: React.ReactNode;
  className?: string;
};

export function FormField({ children, className }: FormFieldProps) {
  return <div className={cn("space-y-0", className)}>{children}</div>;
}
