import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  // A login page has nothing to offer a search engine and everything to lose
  // by being indexed.
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Only a same-site path is ever carried through. Anything else — an absolute
  // URL, a protocol-relative //host — is discarded rather than sanitised, so
  // this cannot become an open redirect.
  const next =
    searchParams.next?.startsWith('/') && !searchParams.next.startsWith('//')
      ? searchParams.next
      : '/admin';

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="label text-accent">Admin</p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em]">
          Sign in
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-[1.5] text-muted">
          This page edits the live site.
        </p>

        <LoginForm next={next} />
      </div>
    </main>
  );
}
