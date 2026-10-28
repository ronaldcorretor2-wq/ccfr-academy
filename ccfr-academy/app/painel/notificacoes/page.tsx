import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { getCtx } from '@/lib/ctx';
import { markAllRead, markRead } from '../actions';

export default async function Notificacoes() {
  const { supabase, user } = await getCtx();
  const { data } = await supabase.from('notifications').select('id,title,body,link,read_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  const items: any[] = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h1>Notificações</h1>
          <p className="m">{unread ? `${unread} não lida${unread > 1 ? 's' : ''}` : 'Tudo em dia.'}</p>
        </div>
        {unread > 0 && <form action={markAllRead}><SubmitButton className="b2">Marcar todas como lidas</SubmitButton></form>}
      </div>
      <section className="pn">
        {items.map((n) => (
          <div className="li" key={n.id} style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h3>{!n.read_at && <span className="tag" style={{ marginRight: 8 }}>Nova</span>}{n.title}</h3>
              {n.body && <p className="m">{n.body}</p>}
              <p className="m">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
              {typeof n.link === 'string' && n.link.startsWith('/') && <Link className="m" href={n.link}>Abrir</Link>}
            </div>
            {!n.read_at && (
              <form action={markRead}><input type="hidden" name="id" value={n.id} /><SubmitButton className="b2">Marcar como lida</SubmitButton></form>
            )}
          </div>
        ))}
        {!items.length && <p className="m">Nenhuma notificação ainda.</p>}
      </section>
    </>
  );
}
