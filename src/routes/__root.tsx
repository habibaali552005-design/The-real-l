import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";
import { ThemeInjector } from "@/components/ThemeInjector";

function NotFoundComponent() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-brand-dark">٤٠٤</h1>
        <h2 className="mt-4 text-xl font-semibold text-brand-dark">الصفحة مش موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-brand-dark px-5 py-3 text-sm font-bold text-brand-bg"
          >
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-brand-dark">
          حصل خطأ أثناء التحميل
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول تحديث الصفحة أو ارجع للرئيسية.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-brand-dark px-5 py-3 text-sm font-bold text-brand-bg"
          >
            حاول تاني
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-brand-bg px-5 py-3 text-sm font-bold text-brand-dark"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "بيتك" },
      {
        name: "description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات بأسعار مناسبة وشحن لكل المحافظات.",
      },
      { name: "author", content: "بيتك" },
      { property: "og:title", content: "بيتك" },
      {
        property: "og:description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات بأسعار مناسبة وشحن لكل المحافظات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "بيتك" },
      {
        name: "description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات بأسعار مناسبة وشحن لكل المحافظات.",
      },
      {
        property: "og:description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات بأسعار مناسبة وشحن لكل المحافظات.",
      },
      {
        name: "twitter:description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات بأسعار مناسبة وشحن لكل المحافظات.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5f468eb1-adea-4526-86b9-c87170a5c73d/id-preview-d39b9d5f--e104ba7b-b29e-45b4-ab8a-df7aacf2437a.lovable.app-1783214255825.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5f468eb1-adea-4526-86b9-c87170a5c73d/id-preview-d39b9d5f--e104ba7b-b29e-45b4-ab8a-df7aacf2437a.lovable.app-1783214255825.png",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <ThemeInjector />
          <Outlet />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}
