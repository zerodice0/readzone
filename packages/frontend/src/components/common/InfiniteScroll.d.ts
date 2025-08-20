import { type ReactNode } from 'react';
interface InfiniteScrollProps {
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    children: ReactNode;
    threshold?: number;
    className?: string;
}
declare const InfiniteScroll: ({ hasMore, isLoading, onLoadMore, children, threshold, className }: InfiniteScrollProps) => import("react/jsx-runtime").JSX.Element;
export default InfiniteScroll;
