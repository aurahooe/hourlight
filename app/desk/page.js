'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../lib/supabase';

export default function Desk() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  async function load(sb, uid) {
    const { data } = await sb
      .from('notes')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    setNotes(data || []);
  }

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace('/enter');
        return;
      }
      setUser(data.user);
      await load(sb, data.user.id);
    });
  }, [router]);

  async function save(e) {
    e.preventDefault();
    setErr('');
    setOk('');
    const sb = getSupabase();
    const { error } = await sb.from('notes').insert({
      user_id: user.id,
      title: title.trim() || 'Untitled',
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) {
      setErr(error.message);
      return;
    }
    setTitle('');
    setBody('');
    setIsPublic(false);
    setOk(isPublic ? 'It is on the street.' : 'Kept in the desk.');
    await load(sb, user.id);
  }

  async function toggle(note) {
    const sb = getSupabase();
    await sb.from('notes').update({ is_public: !note.is_public }).eq('id', note.id);
    await load(sb, user.id);
  }

  async function remove(note) {
    const sb = getSupabase();
    await sb.from('notes').delete().eq('id', note.id);
    await load(sb, user.id);
  }

  async function leave() {
    await getSupabase().auth.signOut();
    router.push('/');
  }

  if (!user) return <div className="wrap">Opening the desk…</div>;

  return (
    <div className="wrap">
      <nav className="nav">
        <Link className="brand" href="/"><span />Hourlight</Link>
        <div className="row" style={{ marginTop: 0 }}>
          <Link className="quiet" href="/">Street</Link>
          <button className="btn ghost" onClick={leave}>Leave</button>
        </div>
      </nav>

      <div className="panel">
        <div className="kicker">Your desk</div>
        <h1 style={{ fontSize: 42 }}>Write something you might keep.</h1>
        <form onSubmit={save}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <label>The note</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          <label className="check">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            Put this on the public street
          </label>
          <div className="row">
            <button className="btn" type="submit">Save</button>
          </div>
          {err && <p className="err">{err}</p>}
          {ok && <p className="ok">{ok}</p>}
        </form>
      </div>

      <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, margin: '36px 0 12px' }}>
        In the drawer
      </h2>
      {notes.length === 0 ? (
        <p className="empty">Empty paper. That is a good start.</p>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <article className="card" key={n.id}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <div className="meta">{n.is_public ? 'On the street' : 'Private'} · {new Date(n.created_at).toLocaleString()}</div>
              <div className="row">
                <button className="btn ghost" onClick={() => toggle(n)}>
                  {n.is_public ? 'Pull inside' : 'Make public'}
                </button>
                <button className="btn ghost" onClick={() => remove(n)}>Throw away</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
