import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

interface CollapsibleProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ children, open: controlledOpen, onOpenChange, className, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(false)

    const open = controlledOpen ?? internalOpen
    const handleOpenChange = onOpenChange ?? setInternalOpen

    const contextValue = React.useMemo(
      () => ({ open, onOpenChange: handleOpenChange }),
      [open, handleOpenChange]
    )

    return (
      <CollapsibleContext.Provider value={contextValue}>
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    )
  }
)

Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ asChild, className, onClick, type, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)

    if (!context) {
      throw new Error("CollapsibleTrigger must be used within a Collapsible")
    }

    const handleClick: React.MouseEventHandler<HTMLElement> = (event) => {
      context.onOpenChange(!context.open)
      onClick?.(event as React.MouseEvent<HTMLButtonElement>)
    }

    if (asChild) {
      return (
        <Slot
          ref={ref}
          onClick={handleClick}
          aria-expanded={context.open}
          data-state={context.open ? "open" : "closed"}
          className={cn("outline-none", className)}
          {...props}
        />
      )
    }

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        onClick={handleClick}
        aria-expanded={context.open}
        data-state={context.open ? "open" : "closed"}
        className={cn("outline-none", className)}
        {...props}
      />
    )
  }
)

CollapsibleTrigger.displayName = "CollapsibleTrigger"

type CollapsibleContentProps = React.HTMLAttributes<HTMLDivElement>

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext)

    if (!context) {
      throw new Error("CollapsibleContent must be used within a Collapsible")
    }

    if (!context.open) {
      return null
    }

    return (
      <div
        ref={ref}
        data-state={context.open ? "open" : "closed"}
        className={cn("overflow-hidden", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
