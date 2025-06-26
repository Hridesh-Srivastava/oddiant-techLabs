"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Drag handle icon component
const DragHandleDots2Icon = ({ className }: { className?: string }) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M5.5 4.625C6.12132 4.625 6.625 4.12132 6.625 3.5C6.625 2.87868 6.12132 2.375 5.5 2.375C4.87868 2.375 4.375 2.87868 4.375 3.5C4.375 4.12132 4.87868 4.625 5.5 4.625ZM9.5 4.625C10.1213 4.625 10.625 4.12132 10.625 3.5C10.625 2.87868 10.1213 2.375 9.5 2.375C8.87868 2.375 8.375 2.87868 8.375 3.5C8.375 4.12132 8.87868 4.625 9.5 4.625ZM6.625 7.5C6.625 8.12132 6.12132 8.625 5.5 8.625C4.87868 8.625 4.375 8.12132 4.375 7.5C4.375 6.87868 4.87868 6.375 5.5 6.375C6.12132 6.375 6.625 6.87868 6.625 7.5ZM9.5 8.625C10.1213 8.625 10.625 8.12132 10.625 7.5C10.625 6.87868 10.1213 6.375 9.5 6.375C8.87868 6.375 8.375 6.87868 8.375 7.5C8.375 8.12132 8.87868 8.625 9.5 8.625ZM6.625 11.5C6.625 12.1213 6.12132 12.625 5.5 12.625C4.87868 12.625 4.375 12.1213 4.375 11.5C4.375 10.8787 4.87868 10.375 5.5 10.375C6.12132 10.375 6.625 10.8787 6.625 11.5ZM9.5 12.625C10.1213 12.625 10.625 12.1213 10.625 11.5C10.625 10.8787 10.1213 10.375 9.5 10.375C8.87868 10.375 8.375 10.8787 8.375 11.5C8.375 12.1213 8.87868 12.625 9.5 12.625Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical"
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  ({ className, direction = "horizontal", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-full w-full", direction === "vertical" ? "flex-col" : "flex-row", className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
ResizablePanelGroup.displayName = "ResizablePanelGroup"

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, defaultSize, minSize, maxSize, children, style, ...props }, ref) => {
    const flexBasis = defaultSize ? `${defaultSize}%` : "auto"

    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-hidden", className)}
        style={{
          flexBasis,
          minWidth: minSize ? `${minSize}%` : undefined,
          maxWidth: maxSize ? `${maxSize}%` : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    )
  },
)
ResizablePanel.displayName = "ResizablePanel"

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
  direction?: "horizontal" | "vertical"
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ withHandle, direction = "horizontal", className, ...props }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const [startPos, setStartPos] = React.useState(0)
    const handleRef = React.useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true)
      setStartPos(direction === "horizontal" ? e.clientX : e.clientY)
      e.preventDefault()
    }

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return

        const currentPos = direction === "horizontal" ? e.clientX : e.clientY
        const diff = currentPos - startPos

        // Here you would implement the actual resizing logic
        // For now, we'll just prevent default behavior
        e.preventDefault()
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      if (isDragging) {
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize"
        document.body.style.userSelect = "none"
      }

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }, [isDragging, startPos, direction])

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center bg-border transition-colors hover:bg-accent",
          direction === "horizontal" ? "w-1 cursor-col-resize hover:w-2" : "h-1 cursor-row-resize hover:h-2 w-full",
          isDragging && "bg-accent",
          className,
        )}
        onMouseDown={handleMouseDown}
        {...props}
      >
        {withHandle && (
          <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-background shadow-sm">
            <DragHandleDots2Icon className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        )}
      </div>
    )
  },
)
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
