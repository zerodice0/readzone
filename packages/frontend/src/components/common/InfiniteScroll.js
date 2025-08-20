import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
const InfiniteScroll = ({ hasMore, isLoading, onLoadMore, children, threshold = 200, className = '' }) => {
    const loadingRef = useRef(null);
    useEffect(() => {
        const loadingElement = loadingRef.current;
        if (!loadingElement || isLoading || !hasMore) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry?.isIntersecting) {
                onLoadMore();
            }
        }, {
            rootMargin: `${threshold}px`,
            threshold: 0.1
        });
        observer.observe(loadingElement);
        return () => {
            if (loadingElement) {
                observer.unobserve(loadingElement);
            }
        };
    }, [hasMore, isLoading, onLoadMore, threshold]);
    return (_jsxs("div", { className: `infinite-scroll ${className}`, children: [children, _jsxs("div", { ref: loadingRef, className: "flex justify-center py-8", children: [isLoading && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary" }), _jsx("span", { className: "text-muted-foreground", children: "\uB354 \uB9CE\uC740 \uB3C5\uD6C4\uAC10\uC744 \uBD88\uB7EC\uC624\uB294 \uC911..." })] })), !hasMore && !isLoading && (_jsx("div", { className: "text-center text-muted-foreground", children: _jsx("p", { className: "text-sm", children: "\uBAA8\uB4E0 \uB3C5\uD6C4\uAC10\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4." }) }))] })] }));
};
export default InfiniteScroll;
