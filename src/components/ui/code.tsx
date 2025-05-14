
import React from 'react';
import { cn } from '@/lib/utils';

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {}

const Code = React.forwardRef<HTMLPreElement, CodeProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <pre
        className={cn(
          "rounded-md bg-slate-100 p-4 font-mono text-sm text-slate-800 overflow-x-auto",
          className
        )}
        ref={ref}
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  }
);

Code.displayName = "Code";

export { Code };
