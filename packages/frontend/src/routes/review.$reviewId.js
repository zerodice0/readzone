import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
function ReviewDetailPage() {
    const { reviewId } = Route.useParams();
    return (_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "\uB3C5\uD6C4\uAC10 \uC0C1\uC138" }), _jsxs("p", { className: "text-muted-foreground", children: ["\uB3C5\uD6C4\uAC10 ID: ", reviewId] })] }));
}
export const Route = createFileRoute('/review/$reviewId')({
    component: ReviewDetailPage,
});
