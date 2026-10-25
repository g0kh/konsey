import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(function SearchInput({ className, ...props }, ref) {
  return (
    <div className="relative">
      <Input ref={ref} className={cn("pr-11", className)} {...props} />
      <Search
        className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </div>
  );
});
