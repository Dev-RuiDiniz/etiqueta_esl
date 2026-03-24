import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from '../lib/router';
import { login } from '../services/authService';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('admin@etiqueta.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = searchParams.get('next') || '/dashboard';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card card border-0 shadow-lg">
        <div className="card-body p-4 p-md-5">
          <span className="badge text-bg-primary mb-3">BFF Auth</span>
          <h1 className="h3 mb-2">Entrar no Painel ESL</h1>
          <p className="text-muted mb-4">
            Use as credenciais do BFF quando `BFF_AUTH_ENABLED=true`. Em ambientes sem autenticação, esta tela pode ser ignorada.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="login-email" className="form-label">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="login-password" className="form-label">
                Senha
              </label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : null}

            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
