import type { ReactNode } from 'react';
import { Workflow } from 'lucide-react';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
};

export const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) => (
  <main className="min-h-screen bg-zinc-50 px-5 py-10 text-zinc-950">
    <section
      className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center"
      aria-labelledby="auth-page-title"
    >
      <header className="mb-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-teal-700 text-white">
            <Workflow className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold">DiagramFlow</span>
        </div>

        <h1 id="auth-page-title" className="text-3xl font-semibold">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>}
      </header>

      {children}

      <div className="mt-6 text-center text-sm text-zinc-600">{footer}</div>
    </section>
  </main>
);
