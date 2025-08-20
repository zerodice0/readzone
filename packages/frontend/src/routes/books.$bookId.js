import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
function BookDetailPage() {
    const { bookId } = Route.useParams();
    return (_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "\uB3C4\uC11C \uC0C1\uC138" }), _jsxs("p", { className: "text-muted-foreground", children: ["\uB3C4\uC11C ID: ", bookId] })] }));
}
export const Route = createFileRoute('/books/$bookId')({
    component: BookDetailPage,
});
