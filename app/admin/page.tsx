import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';
import { getContentUncached, hasStoredContent } from '@/lib/content/source';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Editor } from '@/components/admin/editor';
import { logout } from '@/app/admin/actions';

export const metadata: Metadata = {
  title: 'Edit content',
  robots: { index: false, follow: false },
};

// The admin must never be served from a cache — it edits live data and is
// gated on a per-request cookie.
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Middleware already gated this route. Re-checking here is not redundant:
  // it is what makes the page safe if the matcher is ever changed.
  const session = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) redirect('/admin/login');

  const content = await getContentUncached();
  const configured = isSupabaseConfigured();
  const persisted = configured && (await hasStoredContent());

  return (
    <main className="container-grid py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="label text-accent">Admin</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
            Edit content
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="label transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            View site ↗
          </a>
          <form action={logout}>
            <button
              type="submit"
              className="label transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {!configured && (
        <div
          role="alert"
          className="mt-8 border-l-2 border-accent bg-surface px-5 py-4"
        >
          <p className="text-[0.9375rem] font-medium text-foreground">
            Supabase is not configured — saving is disabled.
          </p>
          <p className="mt-2 max-w-prose text-[0.875rem] leading-[1.5] text-muted">
            You are seeing the content compiled into{' '}
            <code className="font-mono text-[0.8125rem]">content/profile.ts</code>. Set{' '}
            <code className="font-mono text-[0.8125rem]">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code className="font-mono text-[0.8125rem]">SUPABASE_SERVICE_ROLE_KEY</code> in{' '}
            <code className="font-mono text-[0.8125rem]">.env.local</code>, run the migration in{' '}
            <code className="font-mono text-[0.8125rem]">supabase/migrations/0001_init.sql</code>,
            then restart the dev server. Edits made now will not persist.
          </p>
        </div>
      )}

      <div className="mt-10">
        <Editor initial={content} persisted={persisted} />
      </div>
    </main>
  );
}
