'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCtx, requirePlatform, requireStaff } from '@/lib/ctx';

const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const back = (path: string, k: 'erro' | 'ok', msg: string): never => redirect(`${path}?${k}=${encodeURIComponent(msg)}`);

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/login');
}

export async function createOrg(fd: FormData) {
  const { supabase } = await requirePlatform();
  const { error } = await supabase.rpc('create_organization', {
    p_name: txt(fd, 'name'), p_slug: txt(fd, 'slug').toLowerCase(), p_admin_email: txt(fd, 'email'),
  });
  if (error) back('/painel/mestre', 'erro', 'Não foi possível criar a igreja. Confira o nome, o endereço curto (3 a 40 letras minúsculas, números ou hífen, sem repetir) e se o administrador já criou a conta com esse e-mail.');
  back('/painel/mestre', 'ok', 'Igreja criada.');
}

export async function masterSetAdmin(fd: FormData) {
  const { supabase } = await requirePlatform();
  const { error } = await supabase.rpc('master_set_admin', { p_org: txt(fd, 'org_id'), p_email: txt(fd, 'email') });
  if (error) back('/painel/mestre', 'erro', 'Não foi possível adicionar o administrador. Ele precisa ter criado a conta com esse e-mail.');
  back('/painel/mestre', 'ok', 'Administrador adicionado.');
}

export async function masterUpdateOrg(fd: FormData) {
  const { supabase } = await requirePlatform();
  const { error } = await supabase.rpc('master_update_org', {
    p_org: txt(fd, 'org_id'), p_plan: txt(fd, 'plan') || 'teste', p_max: Math.max(0, Number(txt(fd, 'max')) || 0),
  });
  if (error) back('/painel/mestre', 'erro', 'Não foi possível salvar o plano.');
  back('/painel/mestre', 'ok', 'Plano e limite salvos.');
}

export async function joinOrg(fd: FormData) {
  const { supabase } = await getCtx();
  const { error } = await supabase.rpc('join_organization', { p_slug: txt(fd, 'slug') });
  if (error) back('/painel', 'erro', 'Não foi possível entrar. Confira o endereço da igreja; se estiver certo, o limite de vagas pode ter sido atingido, e a igreja precisa ser avisada.');
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
  const { data: quiz } = await supabase.from('assessments').select('id').eq('lesson_id', lessonId).maybeSingle();
  if (quiz) {
    const { count: nq } = await supabase.from('assessment_questions').select('id', { count: 'exact', head: true }).eq('assessment_id', quiz.id);
    if (nq) {
      const { count: okc } = await supabase.from('assessment_attempts').select('id', { count: 'exact', head: true })
        .eq('assessment_id', quiz.id).eq('user_id', user.id).eq('passed', true);
      if (!okc) back(`/painel/aula/${lessonId}`, 'erro', 'Aprove na avaliação para concluir esta aula.');
    }
  }
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

// ---------- Ordem das aulas, edição de aula e pessoas ----------

async function renumber(supabase: any, table: string, col: string, val: string): Promise<string[]> {
  const { data } = await supabase.from(table).select('id').eq(col, val).order('position').order('id');
  const rows: any[] = data ?? [];
  for (let i = 0; i < rows.length; i++) await supabase.from(table).update({ position: i + 1 }).eq('id', rows[i].id);
  return rows.map((r: any) => r.id as string);
}

async function swap(supabase: any, table: string, col: string, val: string, id: string, dir: string) {
  const ids = await renumber(supabase, table, col, val);
  const i = ids.indexOf(id);
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  await supabase.from(table).update({ position: j + 1 }).eq('id', ids[i]);
  await supabase.from(table).update({ position: i + 1 }).eq('id', ids[j]);
}

export async function moveModule(fd: FormData) {
  const { supabase } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  await swap(supabase, 'course_modules', 'course_id', courseId, txt(fd, 'id'), txt(fd, 'dir'));
  redirect(`/painel/admin/cursos/${courseId}`);
}

export async function moveLesson(fd: FormData) {
  const { supabase } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  await swap(supabase, 'lessons', 'module_id', txt(fd, 'module_id'), txt(fd, 'id'), txt(fd, 'dir'));
  redirect(`/painel/admin/cursos/${courseId}`);
}

export async function updateLesson(fd: FormData) {
  const { supabase } = await requireStaff();
  const courseId = txt(fd, 'course_id');
  const { error } = await supabase.from('lessons').update({
    title: txt(fd, 'title'), video_url: txt(fd, 'video_url') || null, content: txt(fd, 'content'),
  }).eq('id', txt(fd, 'id'));
  if (error) back(`/painel/admin/aulas/${txt(fd, 'id')}`, 'erro', 'Não foi possível salvar a aula.');
  back(`/painel/admin/cursos/${courseId}`, 'ok', 'Aula atualizada.');
}

export async function setRole(fd: FormData) {
  const { supabase, member, user } = await requireStaff();
  const path = '/painel/admin/pessoas';
  const userId = txt(fd, 'user_id');
  const role = txt(fd, 'role');
  if (member.role !== 'admin') redirect('/painel/admin');
  if (!['admin', 'teacher', 'student'].includes(role)) back(path, 'erro', 'Papel inválido.');
  if (userId === user.id) back(path, 'erro', 'Você não pode mudar o seu próprio papel.');
  const { error } = await supabase.from('organization_members').update({ role }).eq('org_id', member.orgId).eq('user_id', userId);
  if (error) back(path, 'erro', 'Não foi possível alterar o papel.');
  back(path, 'ok', 'Papel alterado.');
}

export async function removeMember(fd: FormData) {
  const { supabase, member, user } = await requireStaff();
  const path = '/painel/admin/pessoas';
  const userId = txt(fd, 'user_id');
  if (member.role !== 'admin') redirect('/painel/admin');
  if (userId === user.id) back(path, 'erro', 'Você não pode remover a si mesmo.');
  await supabase.from('organization_members').delete().eq('org_id', member.orgId).eq('user_id', userId);
  back(path, 'ok', 'Pessoa removida da igreja.');
}

// ---------- Avaliações ----------

export async function createAssessment(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const lessonId = txt(fd, 'lesson_id');
  const path = `/painel/admin/aulas/${lessonId}`;
  const { data: l } = await supabase.from('lessons').select('course_id').eq('id', lessonId).single();
  const score = Math.min(100, Math.max(1, Number(txt(fd, 'pass_score')) || 70));
  const { error } = await supabase.from('assessments').insert({
    org_id: member.orgId, course_id: l?.course_id, lesson_id: lessonId, title: txt(fd, 'title') || 'Questionário', pass_score: score,
  });
  if (error) back(path, 'erro', 'Não foi possível criar a avaliação.');
  redirect(path);
}

export async function deleteAssessment(fd: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from('assessments').delete().eq('id', txt(fd, 'id'));
  redirect(`/painel/admin/aulas/${txt(fd, 'lesson_id')}`);
}

export async function addQuestion(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const lessonId = txt(fd, 'lesson_id');
  const path = `/painel/admin/aulas/${lessonId}`;
  const assessmentId = txt(fd, 'assessment_id');
  const raw = [0, 1, 2, 3].map((i) => txt(fd, `opt${i}`));
  const chosen = Number(txt(fd, 'correct'));
  if (!txt(fd, 'prompt')) back(path, 'erro', 'Escreva a pergunta.');
  if (raw.filter((o) => o).length < 2) back(path, 'erro', 'Preencha pelo menos duas alternativas.');
  if (!raw[chosen]) back(path, 'erro', 'A alternativa correta precisa estar preenchida.');
  const options = raw.filter((o) => o);
  const correctIndex = raw.slice(0, chosen).filter((o) => o).length;
  const { count } = await supabase.from('assessment_questions').select('id', { count: 'exact', head: true }).eq('assessment_id', assessmentId);
  const { data: q, error } = await supabase.from('assessment_questions').insert({
    org_id: member.orgId, assessment_id: assessmentId, prompt: txt(fd, 'prompt'), options, position: (count ?? 0) + 1,
  }).select('id').single();
  if (error || !q) back(path, 'erro', 'Não foi possível salvar a pergunta.');
  const { error: e2 } = await supabase.from('assessment_answers').insert({ question_id: q!.id, org_id: member.orgId, correct_index: correctIndex });
  if (e2) {
    await supabase.from('assessment_questions').delete().eq('id', q!.id);
    back(path, 'erro', 'Não foi possível salvar a resposta correta.');
  }
  redirect(path);
}

export async function deleteQuestion(fd: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from('assessment_questions').delete().eq('id', txt(fd, 'id'));
  redirect(`/painel/admin/aulas/${txt(fd, 'lesson_id')}`);
}

export async function takeAssessment(fd: FormData) {
  const { supabase } = await getCtx();
  const assessmentId = txt(fd, 'assessment_id');
  const lessonId = txt(fd, 'lesson_id');
  const { data: qs } = await supabase.from('assessment_questions').select('id').eq('assessment_id', assessmentId).order('position');
  const answers: Record<string, number> = {};
  for (const q of (qs ?? []) as any[]) {
    const v = fd.get(`q_${q.id}`);
    if (v !== null) answers[q.id] = Number(v);
  }
  const { data, error } = await supabase.rpc('submit_attempt', { p_assessment: assessmentId, p_answers: answers });
  if (error || !data) back(`/painel/aula/${lessonId}`, 'erro', 'Não foi possível enviar as respostas. Tente de novo.');
  const res: any = data;
  const wrong = (res.results as any[]).map((r: any, i: number) => (r.correct ? 0 : i + 1)).filter((n: number) => n > 0).join(', ');
  redirect(`/painel/aula/${lessonId}?nota=${res.score}&aprovado=${res.passed ? 1 : 0}&erradas=${encodeURIComponent(wrong)}`);
}

// ---------- Retomar vídeo e certificados ----------

export async function savePosition(lessonId: string, seconds: number) {
  const { supabase, user, member } = await getCtx();
  if (!member || !Number.isFinite(seconds) || seconds < 0) return;
  await supabase.from('lesson_progress').upsert({
    org_id: member.orgId, lesson_id: lessonId, user_id: user.id, position_seconds: Math.floor(seconds), updated_at: new Date().toISOString(),
  });
}

export async function issueCertificate(fd: FormData) {
  const { supabase } = await getCtx();
  const courseId = txt(fd, 'course_id');
  const { data, error } = await supabase.rpc('issue_certificate', { p_course: courseId });
  if (error || !data) back(`/painel/cursos/${courseId}`, 'erro', 'Ainda não é possível emitir o certificado. Conclua todas as aulas do curso.');
  redirect(`/painel/certificados/${data}`);
}

// ---------- Anotações, favoritos, materiais, trilhas ----------

export async function saveNote(fd: FormData) {
  const { supabase, user, member } = await getCtx();
  const lessonId = txt(fd, 'lesson_id');
  if (!member) redirect('/painel');
  const { error } = await supabase.from('lesson_notes').upsert({
    org_id: member.orgId, lesson_id: lessonId, user_id: user.id, content: String(fd.get('content') ?? '').slice(0, 5000), updated_at: new Date().toISOString(),
  });
  if (error) back(`/painel/aula/${lessonId}`, 'erro', 'Não foi possível salvar as anotações.');
  back(`/painel/aula/${lessonId}`, 'ok', 'Anotações salvas.');
}

export async function toggleFavorite(fd: FormData) {
  const { supabase, user, member } = await getCtx();
  const courseId = txt(fd, 'course_id');
  if (!member) redirect('/painel');
  const { data } = await supabase.from('favorites').select('course_id').eq('course_id', courseId).eq('user_id', user.id).maybeSingle();
  if (data) await supabase.from('favorites').delete().eq('course_id', courseId).eq('user_id', user.id);
  else await supabase.from('favorites').insert({ org_id: member.orgId, course_id: courseId, user_id: user.id });
  revalidatePath('/painel', 'layout');
  redirect(`/painel/cursos/${courseId}`);
}

export async function addResource(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const lessonId = txt(fd, 'lesson_id');
  const path = `/painel/admin/aulas/${lessonId}`;
  const url = txt(fd, 'url');
  if (!/^https?:\/\//i.test(url)) back(path, 'erro', 'O endereço precisa começar com http:// ou https://.');
  const kind = ['link', 'pdf', 'audio', 'outro'].includes(txt(fd, 'kind')) ? txt(fd, 'kind') : 'link';
  const { data: l } = await supabase.from('lessons').select('course_id').eq('id', lessonId).single();
  const { count } = await supabase.from('lesson_resources').select('id', { count: 'exact', head: true }).eq('lesson_id', lessonId);
  const { error } = await supabase.from('lesson_resources').insert({
    org_id: member.orgId, course_id: l?.course_id, lesson_id: lessonId, title: txt(fd, 'title'), url, kind, position: (count ?? 0) + 1,
  });
  if (error) back(path, 'erro', 'Não foi possível adicionar o material.');
  redirect(path);
}

export async function deleteResource(fd: FormData) {
  const { supabase } = await requireStaff();
  const { data: old } = await supabase.from('lesson_resources').select('storage_path').eq('id', txt(fd, 'id')).maybeSingle();
  if (old?.storage_path) await supabase.storage.from('materiais').remove([old.storage_path]);
  await supabase.from('lesson_resources').delete().eq('id', txt(fd, 'id'));
  redirect(`/painel/admin/aulas/${txt(fd, 'lesson_id')}`);
}

export async function createPath(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const { data, error } = await supabase.from('learning_paths').insert({ org_id: member.orgId, title: txt(fd, 'title') }).select('id').single();
  if (error || !data) back('/painel/admin/trilhas', 'erro', 'Não foi possível criar a trilha.');
  redirect(`/painel/admin/trilhas/${data!.id}`);
}

export async function updatePath(fd: FormData) {
  const { supabase } = await requireStaff();
  const id = txt(fd, 'id');
  const { error } = await supabase.from('learning_paths').update({ title: txt(fd, 'title'), description: txt(fd, 'description') }).eq('id', id);
  if (error) back(`/painel/admin/trilhas/${id}`, 'erro', 'Não foi possível salvar a trilha.');
  back(`/painel/admin/trilhas/${id}`, 'ok', 'Trilha salva.');
}

export async function setPathStatus(fd: FormData) {
  const { supabase } = await requireStaff();
  const id = txt(fd, 'id');
  const status = txt(fd, 'status');
  if (status === 'published') {
    const { count } = await supabase.from('learning_path_courses').select('id', { count: 'exact', head: true }).eq('path_id', id);
    if (!count) back(`/painel/admin/trilhas/${id}`, 'erro', 'Para publicar, adicione pelo menos um curso à trilha.');
  }
  await supabase.from('learning_paths').update({ status }).eq('id', id);
  revalidatePath('/painel', 'layout');
  back(`/painel/admin/trilhas/${id}`, 'ok', status === 'published' ? 'Trilha publicada.' : 'Trilha voltou para rascunho.');
}

export async function deletePath(fd: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from('learning_paths').delete().eq('id', txt(fd, 'id'));
  redirect('/painel/admin/trilhas');
}

export async function addPathCourse(fd: FormData) {
  const { supabase, member } = await requireStaff();
  const pathId = txt(fd, 'path_id');
  const { count } = await supabase.from('learning_path_courses').select('id', { count: 'exact', head: true }).eq('path_id', pathId);
  const { error } = await supabase.from('learning_path_courses').insert({ org_id: member.orgId, path_id: pathId, course_id: txt(fd, 'course_id'), position: (count ?? 0) + 1 });
  if (error) back(`/painel/admin/trilhas/${pathId}`, 'erro', 'Não foi possível adicionar o curso (ele pode já estar na trilha).');
  redirect(`/painel/admin/trilhas/${pathId}`);
}

export async function removePathCourse(fd: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from('learning_path_courses').delete().eq('id', txt(fd, 'id'));
  redirect(`/painel/admin/trilhas/${txt(fd, 'path_id')}`);
}

export async function movePathCourse(fd: FormData) {
  const { supabase } = await requireStaff();
  const pathId = txt(fd, 'path_id');
  await swap(supabase, 'learning_path_courses', 'path_id', pathId, txt(fd, 'id'), txt(fd, 'dir'));
  redirect(`/painel/admin/trilhas/${pathId}`);
}

// ---------- Arquivos enviados e identidade da igreja ----------

export async function registerUpload(lessonId: string, title: string, kind: string, path: string, size: number): Promise<{ ok: boolean; msg?: string }> {
  const { supabase, member } = await requireStaff();
  if (!path.startsWith(`${member.orgId}/${lessonId}/`)) return { ok: false, msg: 'Caminho de arquivo inválido.' };
  const { data: l } = await supabase.from('lessons').select('course_id').eq('id', lessonId).single();
  const { count } = await supabase.from('lesson_resources').select('id', { count: 'exact', head: true }).eq('lesson_id', lessonId);
  const { error } = await supabase.from('lesson_resources').insert({
    org_id: member.orgId, course_id: l?.course_id, lesson_id: lessonId, title: title.trim().slice(0, 160) || 'Material',
    storage_path: path, size_bytes: Math.max(0, Math.floor(size)), kind: kind === 'pdf' ? 'pdf' : 'audio', position: (count ?? 0) + 1,
  });
  if (error) {
    await supabase.storage.from('materiais').remove([path]);
    return { ok: false, msg: 'Não foi possível registrar o arquivo.' };
  }
  revalidatePath(`/painel/admin/aulas/${lessonId}`);
  return { ok: true };
}

export async function saveLogo(path: string): Promise<{ ok: boolean; msg?: string }> {
  const { supabase, member } = await requireStaff();
  if (member.role !== 'admin') return { ok: false, msg: 'Só o administrador pode trocar o logotipo.' };
  if (!path.startsWith(`${member.orgId}/logo/`)) return { ok: false, msg: 'Caminho de arquivo inválido.' };
  const { error } = await supabase.from('organizations').update({ logo_path: path }).eq('id', member.orgId);
  if (error) return { ok: false, msg: 'Não foi possível salvar o logotipo.' };
  revalidatePath('/painel', 'layout');
  return { ok: true };
}

export async function updateOrgName(fd: FormData) {
  const { supabase, member } = await requireStaff();
  if (member.role !== 'admin') redirect('/painel/admin');
  const name = txt(fd, 'name');
  if (name.length < 2) back('/painel/admin/configuracoes', 'erro', 'O nome precisa ter pelo menos 2 letras.');
  const { error } = await supabase.from('organizations').update({ name }).eq('id', member.orgId);
  if (error) back('/painel/admin/configuracoes', 'erro', 'Não foi possível salvar o nome.');
  revalidatePath('/painel', 'layout');
  back('/painel/admin/configuracoes', 'ok', 'Nome salvo.');
}
