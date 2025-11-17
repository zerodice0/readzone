import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-stone-50 group-[.toaster]:text-stone-900 group-[.toaster]:border-stone-200 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm group-[.toaster]:font-sans",
          description: "group-[.toast]:text-stone-600",
          actionButton:
            "group-[.toast]:bg-primary-500 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:font-medium group-[.toast]:hover:bg-primary-600 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-stone-200 group-[.toast]:text-stone-700 group-[.toast]:rounded-lg group-[.toast]:hover:bg-stone-300 group-[.toast]:transition-colors",
          success: "group-[.toast]:border-l-4 group-[.toast]:border-l-green-500",
          error: "group-[.toast]:border-l-4 group-[.toast]:border-l-red-500",
          warning: "group-[.toast]:border-l-4 group-[.toast]:border-l-primary-500",
          info: "group-[.toast]:border-l-4 group-[.toast]:border-l-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
