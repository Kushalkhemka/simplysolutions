"use client"

import {
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors
      closeButton
      duration={4000}
      icons={{
        success: (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full opacity-20 blur-sm animate-pulse" />
            <CheckCircle2 className="size-5 text-emerald-500 relative z-10" strokeWidth={2.5} />
          </div>
        ),
        info: (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-20 blur-sm" />
            <Info className="size-5 text-blue-500 relative z-10" strokeWidth={2.5} />
          </div>
        ),
        warning: (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full opacity-20 blur-sm animate-pulse" />
            <AlertTriangle className="size-5 text-amber-500 relative z-10" strokeWidth={2.5} />
          </div>
        ),
        error: (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-rose-500 rounded-full opacity-20 blur-sm" />
            <XCircle className="size-5 text-red-500 relative z-10" strokeWidth={2.5} />
          </div>
        ),
        loading: (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full opacity-20 blur-sm" />
            <Loader2 className="size-5 text-violet-500 relative z-10 animate-spin" strokeWidth={2.5} />
          </div>
        ),
      }}
      toastOptions={{
        classNames: {
          toast: `
            group toast 
            group-[.toaster]:bg-background/95 
            group-[.toaster]:backdrop-blur-xl 
            group-[.toaster]:text-foreground 
            group-[.toaster]:border-border/50 
            group-[.toaster]:shadow-2xl 
            group-[.toaster]:shadow-black/10
            dark:group-[.toaster]:shadow-black/30
            group-[.toaster]:rounded-xl
            group-[.toaster]:px-4
            group-[.toaster]:py-3.5
            group-[.toaster]:min-h-[56px]
            group-[.toaster]:border
            group-[.toaster]:transition-all
            group-[.toaster]:duration-300
            group-[.toaster]:ease-out
          `,
          title: `
            group-[.toast]:text-sm 
            group-[.toast]:font-semibold 
            group-[.toast]:tracking-tight
          `,
          description: `
            group-[.toast]:text-muted-foreground 
            group-[.toast]:text-xs
            group-[.toast]:mt-0.5
          `,
          actionButton: `
            group-[.toast]:bg-primary 
            group-[.toast]:text-primary-foreground 
            group-[.toast]:font-medium
            group-[.toast]:rounded-lg
            group-[.toast]:px-3
            group-[.toast]:py-1.5
            group-[.toast]:text-xs
            group-[.toast]:transition-all
            group-[.toast]:duration-200
            group-[.toast]:hover:opacity-90
            group-[.toast]:active:scale-95
          `,
          cancelButton: `
            group-[.toast]:bg-muted 
            group-[.toast]:text-muted-foreground
            group-[.toast]:font-medium
            group-[.toast]:rounded-lg
            group-[.toast]:px-3
            group-[.toast]:py-1.5
            group-[.toast]:text-xs
            group-[.toast]:transition-all
            group-[.toast]:duration-200
            group-[.toast]:hover:bg-muted/80
          `,
          closeButton: `
            group-[.toast]:bg-background/80
            group-[.toast]:border-border/50
            group-[.toast]:text-muted-foreground
            group-[.toast]:hover:bg-muted
            group-[.toast]:hover:text-foreground
            group-[.toast]:transition-colors
            group-[.toast]:duration-200
          `,
          success: `
            group-[.toaster]:!border-emerald-500/30
            group-[.toaster]:!bg-gradient-to-r
            group-[.toaster]:!from-emerald-50/95
            group-[.toaster]:!via-background/95
            group-[.toaster]:!to-background/95
            dark:group-[.toaster]:!from-emerald-950/50
            dark:group-[.toaster]:!via-background/95
            dark:group-[.toaster]:!to-background/95
          `,
          error: `
            group-[.toaster]:!border-red-500/30
            group-[.toaster]:!bg-gradient-to-r
            group-[.toaster]:!from-red-50/95
            group-[.toaster]:!via-background/95
            group-[.toaster]:!to-background/95
            dark:group-[.toaster]:!from-red-950/50
            dark:group-[.toaster]:!via-background/95
            dark:group-[.toaster]:!to-background/95
          `,
          warning: `
            group-[.toaster]:!border-amber-500/30
            group-[.toaster]:!bg-gradient-to-r
            group-[.toaster]:!from-amber-50/95
            group-[.toaster]:!via-background/95
            group-[.toaster]:!to-background/95
            dark:group-[.toaster]:!from-amber-950/50
            dark:group-[.toaster]:!via-background/95
            dark:group-[.toaster]:!to-background/95
          `,
          info: `
            group-[.toaster]:!border-blue-500/30
            group-[.toaster]:!bg-gradient-to-r
            group-[.toaster]:!from-blue-50/95
            group-[.toaster]:!via-background/95
            group-[.toaster]:!to-background/95
            dark:group-[.toaster]:!from-blue-950/50
            dark:group-[.toaster]:!via-background/95
            dark:group-[.toaster]:!to-background/95
          `,
        },
      }}
      style={
        {
          "--normal-bg": "hsl(var(--background) / 0.95)",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border) / 0.5)",
          "--success-bg": "hsl(var(--background) / 0.95)",
          "--success-text": "hsl(var(--foreground))",
          "--success-border": "hsl(142 76% 36% / 0.3)",
          "--error-bg": "hsl(var(--background) / 0.95)",
          "--error-text": "hsl(var(--foreground))",
          "--error-border": "hsl(0 84% 60% / 0.3)",
          "--warning-bg": "hsl(var(--background) / 0.95)",
          "--warning-text": "hsl(var(--foreground))",
          "--warning-border": "hsl(38 92% 50% / 0.3)",
          "--info-bg": "hsl(var(--background) / 0.95)",
          "--info-text": "hsl(var(--foreground))",
          "--info-border": "hsl(221 83% 53% / 0.3)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
