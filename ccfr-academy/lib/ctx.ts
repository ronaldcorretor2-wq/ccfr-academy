import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getCtx() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data } = await supabase
    .from('organization_members')
    .select('org_id, role, organizations(name, slug, logo_path)')
    .eq('user_id', user.id)
    .order('joined_at')
    .limit(1)
    .maybeSingle();
  const m: any = data;
  const org: any = m ? (Array.isArray(m.organizations) ? m.organizations[0] : m.organizations) : null;
  const member = m ? { orgId: m.org_id as string, role: m.role as string, orgName: (org?.name ?? '') as string, logoPath: (org?.logo_path ?? null) as string | null } : null;
  const isStaff = !!member && (member.role === 'admin' || member.role === 'teacher');
  return { supabase, user, member, isStaff };
}

export async function requireStaff() {
  const ctx = await getCtx();
  if (!ctx.member || !ctx.isStaff) redirect('/painel');
  return ctx as typeof ctx & { member: NonNullable<typeof ctx.member> };
}

export async function requirePlatform() {
  const { supabase, user } = await getCtx();
  const { data } = await supabase.rpc('is_platform_admin');
  if (data !== true) redirect('/painel');
  return { supabase, user };
}
