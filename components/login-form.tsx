"use client";

import { useActionState } from "react";

import { login, type LoginState } from "../app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="login-form">
      <label htmlFor="email">Email</label>
      <input autoComplete="email" id="email" name="email" required type="email" />

      <label htmlFor="password">Password</label>
      <input autoComplete="current-password" id="password" name="password" required type="password" />

      {state.error ? <p className="login-error" role="alert">{state.error}</p> : null}

      <button disabled={isPending} type="submit">
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
