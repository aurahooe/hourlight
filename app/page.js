'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '../lib/supabase';

export default function Home() {
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [features, setFeatures] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });

    sb.from('hours')
      .select('headline, editorial, slot')
      .order('slot', { ascending: false })
      .limit(1)
      .then(({ data }) => setHour(data?.[0] || null));

    sb.from('notes')
      .select('id, title, body, created_at, user_id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(24)
      .then(({ data }) => setNotes(data || []));

    sb.from('feature_log')
      .select('title, body, shipped_at')
      .order('shipped_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setFeatures(data || []));

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="wrap">
      <nav className="nav">
        <div className="brand"><span />Hourlight</div>
        <div className="row" style={{ marginTop: 0 }}>
          {user ? (
            <Link className="quiet" href="/desk">Your desk</Link>
          ) : (
            <Link className="quiet" href="/enter">Come in</Link>
          )}
        </div>
      </nav>

      <header className="hero">
        <div className="kicker">A public porch</div>
        <h1>Leave a note<br />if you want it seen.</h1>
        <p className="lede">
          Private writing stays in the desk. Anything you mark public walks out onto the street.
          The hour rewrite is not a feed algorithm. It is just the next light.
        </p>
      </header>

      <section className="hour">
        <div className="kicker">This hour</div>
        <h2>{hour?.headline || 'The room is still warming.'}</h2>
        <p className="lede" style={{ margin: 0, position: 'relative' }}>
          {hour?.editorial || 'Come back when the clock turns. Something small will have changed.'}
        </p>
      </section>

      <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, margin: '8px 0 16px' }}>
        On the street
      </h2>
      {notes.length === 0 ? (
        <p className="empty">No public notes yet. The first one sets the weather.</p>
      ) : (
        <div className="grid">
          {notes.map((n, i) => (
            <article className="card" key={n.id} style={{ animationDelay: `${i * 40}ms` }}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <div className="meta">{new Date(n.created_at).toLocaleString()}</div>
            </article>
          ))}
        </div>
      )}

      {features.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <div className="kicker">What changed recently</div>
          <div className="grid" style={{ marginTop: 14 }}>
            {features.map((f) => (
              <article className="card" key={f.shipped_at + f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
