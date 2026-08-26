import { LoginForm } from "../../components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section aria-labelledby="login-heading" className="login-card">
        <p className="login-eyebrow">Design variable registry</p>
        <h1 id="login-heading">Sign in</h1>
        <LoginForm />
      </section>
    </main>
  );
}
