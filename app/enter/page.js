'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../lib/supabase';

export default function Enter() {
  const router = useRouter();
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    const sb = getSupabase();
    try {
      if (mode === 'in') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/desk');
      } else {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          const slug = (handle || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]+/g, '').slice(0, 24) || `desk${Date.now().toString().slice(-5)}`;
          await sb.from('profiles').upsert({
            id: data.user.id,
            handle: slug,
            display_name: handle || slug,
          });
        }
        setMsg('Check your inbox if the project asks for confirmation. Then come back in.');
        if (data.session) router.push('/desk');
      }
    } catch (ex) {
      setErr(ex.message || 'That did not take.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <nav className="nav">
        <Link className="brand" href="/"><span />Hourlight</Link>
        <Link className="quiet" href="/">Back to the street</Link>
      </nav>
      <div className="panel" style={{ maxWidth: 420, marginTop: 56 }}>
        <div className="kicker">{mode === 'in' ? 'Return' : 'New desk'}</div>
        <h1 style={{ fontSize: 40, marginTop: 8 }}>Come in.</h1>
        <form onSubmit={submit}>
          {mode === 'up' && (
            <>
              <label>Name on the desk</label>
              <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. mara" />
            </>
          )}
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label>Password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="row">
            <button className="btn" disabled={busy} type="submit">
              {busy ? 'One moment' : mode === 'in' ? 'Enter' : 'Set a desk'}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
            >
              {mode === 'in' ? 'I need a desk' : 'I already have one'}
            </button>
          </div>
          {err && <p className="err">{err}</p>}
          {msg && <p className="ok">{msg}</p>}
        </form>
      </div>
    </div>
  );
}
