import { Route as rootRoute } from './routes/__root';
import { Route as IndexImport } from './routes/index';
import { Route as LoginImport } from './routes/login';
import { Route as BooksBooksIdImport } from './routes/books.$bookId';
import { Route as ProfileUserIdImport } from './routes/profile.$userId';
import { Route as ReviewReviewIdImport } from './routes/review.$reviewId';
declare module '@tanstack/react-router' {
    interface FileRoutesByPath {
        '/': {
            id: '/';
            path: '/';
            fullPath: '/';
            preLoaderRoute: typeof IndexImport;
            parentRoute: typeof rootRoute;
        };
        '/login': {
            id: '/login';
            path: '/login';
            fullPath: '/login';
            preLoaderRoute: typeof LoginImport;
            parentRoute: typeof rootRoute;
        };
        '/books/$bookId': {
            id: '/books/$bookId';
            path: '/books/$bookId';
            fullPath: '/books/$bookId';
            preLoaderRoute: typeof BooksBooksIdImport;
            parentRoute: typeof rootRoute;
        };
        '/profile/$userId': {
            id: '/profile/$userId';
            path: '/profile/$userId';
            fullPath: '/profile/$userId';
            preLoaderRoute: typeof ProfileUserIdImport;
            parentRoute: typeof rootRoute;
        };
        '/review/$reviewId': {
            id: '/review/$reviewId';
            path: '/review/$reviewId';
            fullPath: '/review/$reviewId';
            preLoaderRoute: typeof ReviewReviewIdImport;
            parentRoute: typeof rootRoute;
        };
    }
}
export declare const routeTree: import("@tanstack/router-core").Route<any, "/", "/", string, "__root__", undefined, {}, {}, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, {
    readonly IndexRoute: import("@tanstack/router-core").Route<import("@tanstack/react-router").RootRoute<undefined, {}, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>, "/", "/", "/", "/", undefined, import("@tanstack/router-core").ResolveParams<"/">, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>;
    readonly LoginRoute: import("@tanstack/router-core").Route<import("@tanstack/react-router").RootRoute<undefined, {}, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>, "/login", "/login", "/login", "/login", undefined, import("@tanstack/router-core").ResolveParams<"/login">, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>;
    readonly BooksBooksIdRoute: import("@tanstack/router-core").Route<import("@tanstack/react-router").RootRoute<undefined, {}, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>, "/books/$bookId", "/books/$bookId", "/books/$bookId", "/books/$bookId", undefined, import("@tanstack/router-core").ResolveParams<"/books/$bookId">, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>;
    readonly ProfileUserIdRoute: import("@tanstack/router-core").Route<import("@tanstack/react-router").RootRoute<undefined, {}, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>, "/profile/$userId", "/profile/$userId", "/profile/$userId", "/profile/$userId", undefined, import("@tanstack/router-core").ResolveParams<"/profile/$userId">, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>;
    readonly ReviewReviewIdRoute: import("@tanstack/router-core").Route<import("@tanstack/react-router").RootRoute<undefined, {}, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>, "/review/$reviewId", "/review/$reviewId", "/review/$reviewId", "/review/$reviewId", undefined, import("@tanstack/router-core").ResolveParams<"/review/$reviewId">, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, import("@tanstack/router-core").AnyContext, {}, undefined, unknown, unknown>;
}, unknown>;
