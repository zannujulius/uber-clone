import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '@/features/auth/authApi';
import { persistToken, setCredentials } from '@/features/auth/authSlice';
import { wsConnect } from '@/features/websocket/websocketSlice';
import { useAppDispatch } from '@/store';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export default function Register() {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [register, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '', gender: '' as Gender | '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.first_name.trim()) e.first_name = 'Required';
    if (!form.last_name.trim())  e.last_name  = 'Required';
    if (!form.email.trim())      e.email      = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone_number.trim()) e.phone_number = 'Required';
    if (!form.password)           e.password   = 'Required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    try {
      const body = {
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(), phone_number: form.phone_number.trim(),
        password: form.password,
        ...(form.gender ? { gender: form.gender } : {}),
      };
      const res = await register(body).unwrap();
      persistToken(res.data.token);
      dispatch(setCredentials({ rider: res.data.rider!, token: res.data.token }));
      dispatch(wsConnect(res.data.token));
      navigate('/home');
    } catch (err: any) {
      setApiError(err?.data?.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-zinc-900 text-sm">🚗</span>
          </div>
          <span className="text-white font-black tracking-tight">RideApp</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-black text-white mb-1">Create account 🚀</h1>
          <p className="text-zinc-500 text-sm mb-8">Join thousands of riders today</p>

          {apiError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" placeholder="John" leftIcon="👤"
                value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
              <Input label="Last Name" placeholder="Doe" leftIcon="👤"
                value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
            </div>

            <Input label="Email" type="email" placeholder="you@example.com" leftIcon="📧"
              value={form.email} onChange={set('email')} error={errors.email} />

            <Input label="Phone Number" type="tel" placeholder="+1 234 567 890" leftIcon="📱"
              value={form.phone_number} onChange={set('phone_number')} error={errors.phone_number} />

            <Input label="Password" placeholder="Min 8 characters" leftIcon="🔒" isPassword
              value={form.password} onChange={set('password')} error={errors.password} />

            {/* Gender selector */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Gender (optional)</p>
              <div className="grid grid-cols-3 gap-2">
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                  <button
                    key={g} type="button"
                    onClick={() => setForm((f) => ({ ...f, gender: f.gender === g ? '' : g }))}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      form.gender === g
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-elevated border-border text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {g === 'MALE' ? '♂ Male' : g === 'FEMALE' ? '♀ Female' : '⚧ Other'}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" fullWidth loading={isLoading} className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-zinc-600 text-xs mt-6 leading-relaxed">
            By registering you agree to our{' '}
            <span className="text-accent cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-accent cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
