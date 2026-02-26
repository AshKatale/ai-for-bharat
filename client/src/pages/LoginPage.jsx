import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.email.includes('@') || form.password.length < 6) {
      setError('Enter a valid email and password (min 6 chars).');
      return;
    }
    setError('');
    navigate('/dashboard');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">Login</h2>
      <p className="mt-1 text-sm text-slate-400">Welcome back. Continue to your dashboard.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="email" type="email" placeholder="Email" className="input" value={form.email} onChange={onChange} />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="input"
          value={form.password}
          onChange={onChange}
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <Button className="w-full">Login</Button>
      </form>
      <p className="mt-4 text-sm text-slate-400">
        No account?{' '}
        <Link to="/signup" className="text-cyan-300 hover:text-cyan-200">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
