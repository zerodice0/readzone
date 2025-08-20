import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
function ProfilePage() {
    const { userId } = Route.useParams();
    return (_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "\uD504\uB85C\uD544" }), _jsxs("p", { className: "text-muted-foreground", children: ["\uC0AC\uC6A9\uC790 ID: ", userId] })] }));
}
export const Route = createFileRoute('/profile/$userId')({
    component: ProfilePage,
});
