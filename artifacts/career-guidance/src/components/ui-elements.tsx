import React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';

// --- BUTTON ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'accent' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const variants = {
      default: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 border border-primary/20",
      accent: "bg-gradient-to-r from-accent to-amber-400 text-accent-foreground shadow-lg shadow-accent/25 hover:shadow-xl hover:-translate-y-0.5 border border-accent/20",
      secondary: "bg-gradient-to-r from-secondary to-teal-400 text-secondary-foreground shadow-lg shadow-secondary/25 hover:shadow-xl hover:-translate-y-0.5 border border-secondary/20",
      outline: "border-2 border-border bg-background hover:bg-muted hover:border-primary/50 text-foreground",
      ghost: "hover:bg-primary/10 hover:text-primary text-foreground",
    };

    const sizes = {
      default: "h-12 px-6 py-3",
      sm: "h-9 px-4 text-sm",
      lg: "h-14 px-8 text-lg",
      icon: "h-12 w-12",
    };

    return (
      <Comp
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {!isLoading && children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// --- CARD ---
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card text-card-foreground shadow-lg shadow-primary/5 overflow-hidden", className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-2xl font-bold leading-none tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

// --- BADGE ---
export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" | "success" | "warning" }) {
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary/10 text-secondary-foreground border border-secondary/20",
    outline: "border border-border text-foreground",
    success: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  };
  
  return (
    <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-colors", variants[variant], className)} {...props} />
  );
}

// --- INPUT & TEXTAREA ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-border bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

// --- PROGRESS ---
export function Progress({ value, className, indicatorClassName }: { value: number, className?: string, indicatorClassName?: string }) {
  return (
    <div className={cn("relative h-3 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div 
        className={cn("h-full w-full flex-1 bg-gradient-to-r from-primary to-secondary transition-all duration-1000 ease-out", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  );
}

// --- SKELETON ---
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
  );
}

// --- CHECKBOX ---
export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded border-2 border-primary/50 text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 accent-primary cursor-pointer transition-all",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";
