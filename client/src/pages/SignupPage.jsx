import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email.includes('@') || form.password.length < 6) {
      setError('Fill all fields correctly. Password must be at least 6 characters.');
      return;
    }
    setError('');
    navigate('/dashboard');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">Sign Up</h2>
      <p className="mt-1 text-sm text-slate-400">Create your account to start optimizing discoverability.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input name="name" placeholder="Full Name" className="input" value={form.name} onChange={onChange} />
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
        <Button className="w-full">Create Account</Button>
      </form>
      <p className="mt-4 text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-300 hover:text-cyan-200">
          Login
        </Link>
      </p>
    </div>
  );
}

export default SignupPage;
