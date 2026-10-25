'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCtx, requireStaff } from '@/lib/ctx';

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const back = (path: string, k: 'erro' | 'ok', msg: string): never => redirect(`${path}?${k}=${encodeURIComponent(msg)}`);

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/login');
}

export async function createOrg(fd: FormData) {
  const { supabase } = await getCtx();
  const slug = txt(fd, 'slug').toLowerCase();
  const { error } = await supabase.rpc('create_organization', { p_name: txt(fd, 'name'), p_slug: slug });
  if (error) back('/painel', 'erro', 'Não foi possível criar a igreja. O endereço precisa ter de 3 a 40 letras minúsculas, números ou hífens, e não pode já existir.');
  redirect('/painel');
}

export async function joinOrg(fd: FormData) {
  const { supabase } = await getCtx();
  const { error } = await supabase.rpc('join_organization', { p_slug: txt(fd, 'slug') });
  if (error) back('/painel', 'erro', 'Igreja não encontrada. Confira o endereço com a sua igreja.');
  redirect('/painel');
}

export async function enroll(fd: FormData) {
  const { supabase, user, member } = await getCtx();
  const courseId = txt(fd, 'course_id');
  if (!member) redirect('/painel');
  await supabase.from('enrollments').upsert({ org_id: member.orgId, course_id: courseId, user_id: user.id }, { onConflict: 'course_id,user_id', ignoreDuplicates: true });
  redirect(`/painel/cursos/${courseId}`);
}

export async function completeLesson(fd: FormData) {
  const { supabase, user, member } = await getCtx();
  const lessonId = txt(fd, 'lesson_id');
  if (!member) redirect('/painel');
  const { error } = await supabase.from('lesson_progress').upsert({
    org_id: member.orgId, lesson_id: lessonId, user_id: user.id, completed: true, updated_at: new Date().toISOString(),
  });
  if (error) back(`/painel/aula/${lessonId}`, 'erro', 'Não foi possível salvar seu progresso. Tente de novo.');
  revalidatePath('/painel', 'layout');
  redirect(`/painel/aula/${lessonId}?ok=${encodeURIComponent('Aula concluída.')}`);
}

// ---------- Administração (RLS também confere o papel no banco) ----------

export async function createCourse(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const { data, error } = await supabase.from('courses').insert({ org_id: member.orgId, title: txt(fd, 'title') }).select('id').single();
  if (error || !data) back('/painel/admin', 'erro', 'Não foi possível criar o curso.');
  redirect(`/painel/admin/cursos/${data!.id}`);
}

export async function updateCourse(fd: FormData) {
  const { supabase } = await requireStaff();
  const id = txt(fd, 'id');
  const { error } = await supabase.from('courses').update({ title: txt(fd, 'title'), description: txt(fd, 'description') }).eq('id', id);
  if (error) back(`/painel/admin/cursos/${id}`, 'erro', 'Não foi possível salvar o curso.');
  revalidatePath('/painel', 'layout');
  back(`/painel/admin/cursos/${id}`, 'ok', 'Alterações salvas.');
}

export async function setStatus(fd: FormData) {
  const { supabase } = await requireStaff();
  const id = txt(fd, 'id');
  const status = txt(fd, 'status');
  const path = `/painel/admin/cursos/${id}`;
  if (status === 'published') {
    const [{ data: c }, { count }] = await Promise.all([
      supabase.from('courses').select('title,description').eq('id', id).single(),
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', id),
    ]);
    if (!c || !c.title || !c.description) back(path, 'erro', 'Para publicar, preencha título e descrição do curso.');
    if (!count) back(path, 'erro', 'Para publicar, adicione pelo menos uma aula.');
  }
  const { error } = await supabase.from('courses').update({ status }).eq('id', id);
  if (error) back(path, 'erro', 'Não foi possível alterar o estado do curso.');
  revalidatePath('/painel', 'layout');
  back(path, 'ok', status === 'published' ? 'Curso publicado.' : 'Curso voltou para rascunho.');
}

export async function deleteCourse(fd: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from('courses').delete().eq('id', txt(fd, 'id'));
  revalidatePath('/painel', 'layout');
  redirect('/painel/admin');
}

export async function addModule(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  const { count } = await supabase.from('course_modules').select('id', { count: 'exact', head: true }).eq('course_id', courseId);
  const { error } = await supabase.from('course_modules').insert({ org_id: member.orgId, course_id: courseId, title: txt(fd, 'title'), position: (count ?? 0) + 1 });
  if (error) back(`/painel/admin/cursos/${courseId}`, 'erro', 'Não foi possível adicionar o módulo.');
  redirect(`/painel/admin/cursos/${courseId}`);
}

export async function deleteModule(fd: FormData) {
  const { supabase } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  await supabase.from('course_modules').delete().eq('id', txt(fd, 'id'));
  redirect(`/painel/admin/cursos/${courseId}`);
}

export async function addLesson(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  const moduleId = txt(fd, 'module_id');
  const { count } = await supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('module_id', moduleId);
  const { error } = await supabase.from('lessons').insert({
    org_id: member.orgId, course_id: courseId, module_id: moduleId, title: txt(fd, 'title'),
    video_url: txt(fd, 'video_url') || null, content: txt(fd, 'content'), position: (count ?? 0) + 1,
  });
  if (error) back(`/painel/admin/cursos/${courseId}`, 'erro', 'Não foi possível adicionar a aula.');
  redirect(`/painel/admin/cursos/${courseId}`);
}

export async function deleteLesson(fd: FormData) {
  const { supabase } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  await supabase.from('lessons').delete().eq('id', txt(fd, 'id'));
  redirect(`/painel/admin/cursos/${courseId}`);
}
