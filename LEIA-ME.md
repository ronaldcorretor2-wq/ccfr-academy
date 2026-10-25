# CCFR Academy: primeira versão funcional

Plataforma de ensino com várias igrejas (multi-tenant). Next.js + Supabase, para publicar no Netlify.

## O que já funciona
- Cadastro, login e saída (senha guardada com segurança pelo Supabase).
- Criar uma igreja (quem cria vira administrador) ou entrar numa igreja pelo endereço curto (como aluno).
- Administração: criar curso, módulos e aulas (vídeo do YouTube + texto), publicar/despublicar, excluir com confirmação.
- Um curso só é publicado com título, descrição e pelo menos uma aula.
- Aluno: vê cursos publicados, matricula-se, assiste, conclui aulas e vê o percentual; "Continuar aula".
- Administrador vê o progresso dos alunos matriculados em cada curso.
- Isolamento entre igrejas feito no banco (RLS). O papel de cada pessoa vem sempre do banco, nunca do navegador.

## O que ainda NÃO existe
Retomar o vídeo no segundo exato, anotações, favoritos, avaliações, certificados, trilhas, upload de PDF/áudio, reordenar módulos e aulas, editar uma aula já criada, recuperação de senha, painel mestre do SaaS, registro de ações (auditoria) e testes automatizados. O visual é provisório.

## Passo a passo
1. **Banco:** no Supabase, abra **SQL Editor**, crie uma consulta nova, cole o conteúdo de `supabase/migrations/001_inicial.sql` e clique em **Run**.
2. **Para testar mais fácil:** em **Authentication**, na configuração do provedor de e-mail, desligue "Confirm email". (Depois, para valer, ligue de novo.)
3. **Chaves:** em **Project Settings > API**, copie o **Project URL** e a chave **anon** (ou "publishable"). Nunca use a chave "service_role".
4. **GitHub:** descompacte o zip e envie todos os arquivos e pastas para o repositório (Add file > Upload files).
5. **Netlify:** Add new site > Import an existing project > GitHub > escolha o repositório. Em **Environment variables**, crie:
   - `NEXT_PUBLIC_SUPABASE_URL` = o Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = a chave anon/publishable
   Depois clique em Deploy.
6. Com o site no ar, copie o endereço dele e coloque em **Supabase > Authentication > URL Configuration > Site URL**.

## Teste de ponta a ponta
1. Crie uma conta e cadastre a igreja (ex.: nome "CCFR", endereço "ccfr"). 2. Em Administração, crie um curso, um módulo e uma aula. 3. Preencha a descrição e publique. 4. Em outro navegador (ou janela anônima), crie outra conta e entre na igreja "ccfr". 5. O aluno matricula-se, assiste e conclui a aula. 6. O administrador abre o curso e vê o progresso. 7. Crie uma terceira conta e outra igreja ("outra-igreja"). 8. Confirme que ela não vê nenhum curso da primeira.

## Segurança: pontos de atenção
- Hoje qualquer pessoa logada pode cadastrar uma igreja e entrar em qualquer igreja que conheça o endereço. Isso é para a fase de testes; antes de vender para outras igrejas, o cadastro de igrejas passa para o painel mestre e a entrada de alunos ganha aprovação.
- Nunca coloque a chave `service_role` no Netlify nem no GitHub.
