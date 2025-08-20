import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { type VariantProps } from 'class-variance-authority';
declare const ToastProvider: import("react").FC<ToastPrimitives.ToastProviderProps>;
declare const ToastViewport: ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport> & {
    ref?: React.ComponentRef<typeof ToastPrimitives.Viewport>;
}) => import("react/jsx-runtime").JSX.Element;
declare const toastVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
declare const Toast: ({ className, variant, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants> & {
    ref?: React.ComponentRef<typeof ToastPrimitives.Root>;
}) => import("react/jsx-runtime").JSX.Element;
declare const ToastAction: ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> & {
    ref?: React.ComponentRef<typeof ToastPrimitives.Action>;
}) => import("react/jsx-runtime").JSX.Element;
declare const ToastClose: ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> & {
    ref?: React.ComponentRef<typeof ToastPrimitives.Close>;
}) => import("react/jsx-runtime").JSX.Element;
declare const ToastTitle: ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> & {
    ref?: React.ComponentRef<typeof ToastPrimitives.Title>;
}) => import("react/jsx-runtime").JSX.Element;
declare const ToastDescription: ({ className, ref, ...props }: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> & {
    ref?: React.ComponentRef<typeof ToastPrimitives.Description>;
}) => import("react/jsx-runtime").JSX.Element;
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement;
export { type ToastProps, type ToastActionElement, ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, };
