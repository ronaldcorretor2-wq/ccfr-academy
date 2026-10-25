# Contexto do projeto (para futuras sessões)
- Produto: CCFR Academy, LMS cristão, multi-igreja. Primeira igreja: Comunidade Cristã Família e Reino.
- Stack: Next.js 14 (App Router) + TypeScript + Supabase (Auth, Postgres com RLS). Deploy: Netlify via GitHub.
- Decisão do dono: visual (cores preto e branco, fontes) fica para depois; prioridade é funcionar de ponta a ponta.
- Estado: Fase 2/3/4 em versão mínima (ver LEIA-ME.md). Próximos: editar/reordenar aulas, retomar vídeo, avaliações, certificados, trilhas, painel mestre, auditoria, testes de isolamento.
- Regras: papel e organização vêm do banco (RLS), nunca do navegador; org_id nas ações é derivado da sessão no servidor.
- Avaliações (migração 002): questionário por aula, correção no banco (função submit_attempt); gabarito em tabela só da equipe; aula com avaliação só conclui após aprovação.
