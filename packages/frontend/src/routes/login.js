import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFileRoute } from '@tanstack/react-router';
function LoginPage() {
    return (_jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "\uB85C\uADF8\uC778" }), _jsx("p", { className: "text-muted-foreground", children: "\uB85C\uADF8\uC778 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4." })] }));
}
export const Route = createFileRoute('/login')({
    component: LoginPage,
});
