# CCFR Academy

Plataforma de ensino cristão com várias igrejas (multi-tenant). Next.js 14 + Supabase (login, banco com RLS e arquivos). Publicação no Netlify, código no GitHub.

## O que existe
- **Aluno:** painel com "Continuar aula", cursos com progresso, favoritos, trilhas com pré-requisito, sala de aula (vídeo do YouTube que retoma de onde parou, texto, materiais, anotações, avaliação com correção automática), certificados com código verificável, avisos da igreja, notificações (novo aviso, novo curso, certificado pronto), tema claro e escuro.
- **Administração da igreja:** cursos com foto de capa (sem foto, o curso recebe uma capa geométrica), módulos e aulas (editar, reordenar), envio de PDF e áudio, avaliações, publicação com trava de curso incompleto, trilhas, pessoas e papéis (aluno, professor, administrador), relatórios, avisos, registro de ações, nome e logotipo, catálogo público opcional.
- **Painel mestre (dono da plataforma):** cadastra igrejas, define plano e limite de alunos.
- **Segurança:** isolamento entre igrejas no banco (RLS), papéis vindos do banco, gabarito invisível ao aluno, arquivos privados por igreja, 16 testes automáticos de isolamento.
- **Acesso:** cadastro, login, recuperação de senha, e-mail de confirmação que já abre a sessão.

## Variáveis de ambiente (Netlify)
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL do Supabase (sem `/rest/v1/` no final).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chave anon ou publishable. **Nunca** use a service_role.

## Banco de dados: ordem dos arquivos em `supabase/migrations`
001, 002, 003, 004, 005, 007, 008, 009, 010 e 011 (rode cada um uma vez; do 002 em diante podem ser repetidos sem erro se forem a versão reexecutável). O `006` cria a função de teste: rode-o e depois `select * from run_isolation_tests();`. Todas as 16 linhas devem dar `passou = true`.

Depois do 005, torne-se dono da plataforma (troque o e-mail):
`insert into platform_admins (user_id) select id from auth.users where email = 'SEU-EMAIL';`

## Variável opcional
- `IGREJA_PADRAO` (Netlify): endereço curto da igreja (ex.: `ccfr`). Quando preenchida, a tela de login mostra o logotipo e o nome dessa igreja e quem cria conta entra nela automaticamente. Sem ela, a tela é genérica.

## Supabase: configurações
- **Authentication > URL Configuration:** Site URL = endereço do site. Em **Redirect URLs**, adicione `https://SEU-SITE/auth/callback`.
- **Authentication > Email:** "Confirm email" ligado em produção.

## Publicação
GitHub recebe o código; o Netlify publica sozinho a cada envio. Se o repositório tiver a pasta `ccfr-academy` dentro dele, o `netlify.toml` na raiz precisa ter `base = "ccfr-academy"`.

## Fluxo para uma nova igreja
1. O administrador da igreja cria a conta no site.
2. No painel mestre, cadastre a igreja com o e-mail dele (nome, endereço curto, administrador).
3. Os alunos criam conta informando o endereço da igreja (ou usam o link `/c/ENDEREÇO` se o catálogo público estiver ligado).
4. O administrador promove professores em Administração > Pessoas.

## Ainda não existe
subdomínios e domínios próprios por igreja, notificações por e-mail, questões abertas e de resposta múltipla, relatórios aluno a aluno exportáveis, histórico de uso de armazenamento.

## Identidade visual (brandbook Família e Reino, Coco Design 2026)
- **Arquivos da marca:** `public/brand` (logotipos em preto e off-white, símbolo, padrão verde e a foto padrão do destaque do painel, `foto-hero.jpg`). Para trocar a foto do destaque, substitua esse arquivo.
- **Cores:** definidas no início de `app/globals.css` (preto, off-white `#F7FAF7`, coral, amarelo, roxo, verde e pêssego). Tema claro por padrão, com botão para o escuro.
- **Fonte:** a marca usa a Franie; o site usa Poppins (parecida). Para trocar, altere o `<link>` em `app/layout.tsx` e a `font-family` em `app/globals.css` quando houver licença web da Franie.
- **Capas dos cursos:** com foto enviada, aparece a foto; sem foto, aparece um bloco de cor da marca com o título na vertical.
- **Logotipo da igreja:** sem logotipo enviado, o site usa o logotipo da CCFR. Outras igrejas devem enviar o próprio em Administração > Configurações da igreja (no menu escuro ele é exibido em branco automaticamente).
