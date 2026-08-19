'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login, type LoginState } from '@/app/admin/actions';

const initial: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 w-full border border-border-strong bg-transparent py-3 text-[0.9375rem] font-medium text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(login, initial);

  return (
    <form action={formAction} className="mt-10">
      <input type="hidden" name="next" value={next} />

      <label className="label block" htmlFor="username">
        Username
      </label>
      <input
        id="username"
        name="username"
        type="text"
        required
        autoComplete="username"
        autoFocus
        spellCheck={false}
        autoCapitalize="none"
        className="mt-3 w-full border-b border-border-strong bg-transparent pb-2 font-mono text-[0.9375rem] text-foreground outline-none transition-colors focus:border-accent"
      />

      <label className="label mt-8 block" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="mt-3 w-full border-b border-border-strong bg-transparent pb-2 font-mono text-[0.9375rem] text-foreground outline-none transition-colors focus:border-accent"
      />

      {state.error && (
        // aria-live so the failure is announced rather than only seen — this
        // form is the one place a screen reader user gets stuck silently.
        <p
          role="alert"
          aria-live="polite"
          className="mt-6 border-l-2 border-accent pl-4 text-[0.875rem] leading-[1.5] text-muted"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
