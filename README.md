# VetCare · front-end

Front-end do VetCare (clínica veterinária), feito a partir do fluxo do protótipo do Figma Make,
com o design revisado para ficar mais funcional. Só front: a API ainda não está ligada, então o
app roda com dados de demonstração guardados no navegador.

**Stack:** React 18 + Vite 5, Mantine 7 (componentes, formulários, datas, avisos), Tabler Icons, dayjs, React Router 6.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5181
npm run build      # gera dist/
```

Na tela de login, escolha o **perfil de demonstração** (a senha já vem preenchida). Os dados de
exemplo são recriados a cada dia; o botão **Restaurar demonstração** (barra lateral) volta tudo ao início.

## Perfis e páginas (mesmo fluxo do Figma)

| Perfil | Páginas |
|---|---|
| Recepcionista | **Agenda** (linha do tempo por veterinário, dia/semana, pedidos do portal, chegada, remarcar, cancelar) · **Pacientes** (tutores e pacientes, busca, novo paciente com tutor novo ou já cadastrado, edição, exclusão) · **Caixa** (a receber, pagamentos do dia, baixa com troco e parcelas) |
| Veterinário | **Atendimentos** (fila do dia e ficha: anamnese, histórico, vacinação, prescrição) · **Prontuários** · **Vacinas** (atrasadas, próximas, aplicadas) · **Prescrições** (rascunho, emissão, PDF) |
| Administrador | **Dashboard** (faturamento, atendimentos, ticket, a receber, semanas, formas de pagamento) · **Relatórios** (CSV/PDF) · **Usuários** (convite, perfil, desativar) · **Financeiro** (receitas, despesas, saldo) |
| Tutor | **Meus pets** · **Vacinas** (carteira e lembretes) · **Consultas** (pedir, acompanhar, cancelar) · **Receitas** (ver, compartilhar, PDF) |

Os perfis conversam entre si: o pedido do tutor aparece na agenda da recepção; a chegada avisa o
veterinário; concluir o atendimento grava o prontuário, emite a prescrição para o tutor e manda a
cobrança para o caixa; o caixa alimenta o dashboard e o financeiro.

## O que mudou em relação ao protótipo

- Números calculados a partir dos dados (nada de valor fixo): indicadores, totais, gráfico semanal.
- Cada modal virou um formulário de verdade, com validação e mensagens em português.
- Agenda com uma faixa por veterinário e checagem de horário ocupado ao marcar.
- Ficha de atendimento com estados (aguardando → em atendimento → concluído).
- Tabelas viram listas de duas linhas no celular; navegação inferior no celular.
- Contraste e tamanhos de texto revisados (pílulas de estado legíveis, botão principal AA).

## Ligar na API

Toda a comunicação passa por `src/api/index.js`. O passo a passo e a rota sugerida para cada
função estão em [`src/api/README.md`](src/api/README.md). Copie `.env.example` para `.env` e
preencha `VITE_API_URL`. O MSW (API simulada) liga com `VITE_ENABLE_MSW=true`; em `npm run dev` ele já vem ligado por `.env.development`. Para usar a API real, crie `.env.local` com `VITE_ENABLE_MSW=false`.

## Estrutura

```
src/
  api/          serviços (index.js), cliente HTTP (http.js), banco de demonstração (db.js)
  data/seed.js  dados de exemplo e listas fixas (preços, vacinas, formas de pagamento)
  auth/         sessão e perfis
  layout/       barra lateral, barra do celular, avisos
  components/   peças compartilhadas (tabela, indicadores, modais de agendamento, pagamento, vacina, prescrição…)
  pages/        uma pasta por perfil
```

## Dados de exemplo

Todos os nomes, CPFs, telefones, e-mails e valores são fictícios e precisam ser trocados pelos
dados reais da API. A tabela de preços dos atendimentos (`PRICES` em `src/data/seed.js`) também é
de exemplo e deve vir do back-end.

## Documento do fluxo

Resumo do fluxo do sistema em PDF: [`docs/VetCare-Fluxo-do-Sistema.pdf`](docs/VetCare-Fluxo-do-Sistema.pdf) (fonte em `docs/fluxo-vetcare.html`).
