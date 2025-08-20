import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
export const Route = createRootRoute({
    component: () => (_jsx("div", { className: "min-h-screen bg-background text-foreground", children: _jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-4xl font-bold text-center mb-8", children: _jsx(Link, { to: "/", children: "ReadZone" }) }), _jsx(Outlet, {})] }) })),
});
