# Camada de API do front

As telas **nunca** chamam `fetch` direto: elas usam as funções de `index.js` (todas devolvem `Promise`).
Todas as funções (`auth`, `users`, `petOwners`, `pets`) usam a API real (`http.js` + `ENDPOINTS`); em desenvolvimento as rotas são simuladas pelo MSW (`src/mocks/handlers/`).

As telas não chamam `index.js` direto: usam os hooks do React Query em `src/api/queries/` (`usePetOwners`, `useCreatePet`, `useUsers`, ...), que guardam as chaves de cache e invalidam as listas após cada mutação.

Configuração: coloque o endereço da API em `.env` → `VITE_API_URL=https://...`. O token é guardado em `tokenStore` (`http.js`); `index.js` só faz as requisições. O `http.js` já manda `Authorization: Bearer` e lança `ApiError`; o redirecionamento para `/login` em 401 fica no handler global (`ApiErrorHandler`, acionado pelo `queryClient`).

## Mapeamento de campos (API → telas)

A tradução fica em `mappers.js`; as telas continuam usando os nomes antigos nos campos abaixo.

| API                                                              | Telas                           |
| ---------------------------------------------------------------- | ------------------------------- |
| `birthdate` (`YYYY-MM-DD`)                                       | `birth`                         |
| `notes`                                                          | `alerts`                        |
| `petOwner` / `petOwnerId`                                        | `petOwner` / `petOwnerId`       |
| `cpf`, `phone` (só dígitos)                                      | mascarados para exibição        |
| `{ data, total, page, pageSize }`                                | `{ rows, total, pageSize }`     |
| `status` do usuário: `ACTIVE` / `PENDING_INVITE` / `DEACTIVATED` | `ativo` / `convite` / `inativo` |
| `lastAccessAt` / `inviteSentAt`                                  | `lastSeen` / `invitedAt`        |

Ao enviar, CPF e telefone vão só com dígitos, o CPF não é editável (o `PATCH` do tutor não o envia) e o tutor de um pet não muda (o `PATCH` do pet não envia `petOwnerId`).

Erros: se a API devolver `{ "message": "..." }`, o texto aparece no aviso vermelho da tela.

## Rotas sugeridas (uma por função)

| Função                                                 | Rota sugerida                                                                        | Quem usa                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------- |
| `auth.login({ email, password })`                      | `POST /auth/login` → `{ token, user: { id, name, email, role } }`                    | Login                        |
| `auth.me()`                                            | `GET /users/me` → `{ id, name, email, role }`                                        | Sessão (ao recarregar)       |
| `users.list({ search, page })`                         | `GET /users?search=&page=` → `{ data, total, page, pageSize }` (só admin; sem senha) | Admin › Usuários             |
| `users.invite({ name, email, role })`                  | `POST /users/invite` (só admin; 409 se o e-mail já existir)                          | Admin › Convidar usuário     |
| `users.update(id, { name, role })`                     | `PATCH /users/:id` (só admin; e-mail não é editável)                                 | Admin › Editar usuário       |
| `users.deactivate(id)`                                 | `POST /users/:id/deactivate` (só admin)                                              | Admin › Desativar acesso     |
| `users.acceptInvite(token, { password })`              | `POST /users/invite/:token/accept` → `{ token }` (pública)                           | Página `/convite/:token`     |
| `petOwners.list({ search, page })`                     | `GET /pet-owners?search=&page=` → `{ data, total, page, pageSize }` (com `pets[]`)   | Recepção › Pacientes         |
| `petOwners.get(id)`                                    | `GET /pet-owners/:id` (com `pets[]`; 404 se não existir ou foi excluído)             | Ficha do tutor               |
| `petOwners.create(data)`                               | `POST /pet-owners` (aceita `pets[]` junto; 409 se o CPF já existir) → `PetOwner`     | Cadastro de tutor e pet      |
| `petOwners.update(id, data)`                           | `PATCH /pet-owners/:id` com `{ name, phone, email, address }` (CPF não é editável)   | Editar tutor                 |
| `petOwners.remove(id)`                                 | `DELETE /pet-owners/:id` (exclusão lógica, inclui os pets; 404 se não existir)       | Excluir tutor                |
| `pets.list({ search, page })`                          | `GET /pets?search=&page=` → `{ data, total, page, pageSize }` (com `petOwner`)       | Recepção › Pacientes         |
| `pets.get(id)`                                         | `GET /pets/:id` (com `petOwner`)                                                     | Ficha do pet                 |
| `pets.create(data)`                                    | `POST /pets` com `petOwnerId` → `Pet`                                                | Novo pet                     |
| `pets.update(id, data)`                                | `PATCH /pets/:id` sem `petOwnerId` (o tutor não muda)                                | Editar pet                   |
| `pets.remove(id)`                                      | `DELETE /pets/:id`                                                                   | Excluir pet                  |
| `appointments.range(from, to)`                         | `GET /appointments?from=&to=`                                                        | Agenda (dia/semana)          |
| `appointments.requests()`                              | `GET /appointments?status=solicitada`                                                | Agenda › Pedidos dos tutores |
| `appointments.get(id)`                                 | `GET /appointments/:id`                                                              | Detalhes da consulta         |
| `appointments.forVet(vetId, date)`                     | `GET /appointments?vetId=&date=`                                                     | Veterinário › Atendimentos   |
| `appointments.forTutor(tutorId)`                       | `GET /tutors/:id/appointments`                                                       | Portal › Consultas           |
| `appointments.slots({ date, vetId, type })`            | `GET /appointments/slots?date=&vetId=&type=`                                         | Formulário de agendamento    |
| `appointments.create(data)`                            | `POST /appointments`                                                                 | Recepção › Novo agendamento  |
| `appointments.request(data)`                           | `POST /appointments/requests`                                                        | Portal › Agendar consulta    |
| `appointments.update(id, data)`                        | `PUT /appointments/:id`                                                              | Remarcar                     |
| `appointments.confirmRequest(id, vetId)`               | `POST /appointments/:id/confirm`                                                     | Agenda › Confirmar pedido    |
| `appointments.setStatus(id, status, reason)`           | `PATCH /appointments/:id/status`                                                     | Chegada, cancelar, recusar   |
| `appointments.cancelByTutor(id)`                       | `POST /appointments/:id/cancel`                                                      | Portal › Cancelar            |
| `care.start(id)`                                       | `POST /appointments/:id/start`                                                       | Iniciar atendimento          |
| `care.finish(id, { record, prescription })`            | `POST /appointments/:id/finish`                                                      | Concluir atendimento         |
| `records.create(data)`                                 | `POST /pets/:id/records`                                                             | Prontuário › Novo registro   |
| `charges.pending()`                                    | `GET /charges?status=pendente`                                                       | Caixa                        |
| `charges.paidOn(date)`                                 | `GET /charges?status=pago&date=`                                                     | Caixa                        |
| `charges.pay(id, { method, installments })`            | `POST /charges/:id/pay`                                                              | Registrar pagamento          |
| `charges.createPaid(data)`                             | `POST /charges` (lançamento avulso)                                                  | Registrar pagamento › Avulso |
| `vaccines.list()`                                      | `GET /vaccines`                                                                      | Veterinário › Vacinas        |
| `vaccines.forTutor(tutorId)`                           | `GET /tutors/:id/vaccines`                                                           | Portal › Vacinas             |
| `vaccines.apply(data)`                                 | `POST /vaccines/apply`                                                               | Registrar aplicação          |
| `reminders.forTutor(tutorId)` / `reminders.save(data)` | `GET /tutors/:id/reminders` · `PUT /pets/:id/reminder`                               | Portal › Lembrete de vacina  |
| `prescriptions.list()`                                 | `GET /prescriptions`                                                                 | Veterinário › Prescrições    |
| `prescriptions.save(data)`                             | `POST /prescriptions` · `PUT /prescriptions/:id`                                     | Nova prescrição / rascunho   |
| `documents.forTutor(tutorId)`                          | `GET /tutors/:id/documents`                                                          | Portal › Receitas            |
| `dashboard.overview()`                                 | `GET /dashboard/overview`                                                            | Admin › Dashboard            |
| `finance.month('YYYY-MM')`                             | `GET /finance?month=`                                                                | Admin › Financeiro           |
| `finance.add(data)` / `finance.remove(id)`             | `POST /finance/movements` · `DELETE /finance/movements/:id`                          | Nova movimentação            |
| `reports.list()` / `reports.generate(params)`          | `GET /reports` · `POST /reports`                                                     | Admin › Relatórios           |
| `notifications.list(viewer)` / `markAllRead(viewer)`   | `GET /notifications` · `POST /notifications/read`                                    | Avisos (todos os perfis)     |

O formato de cada objeto (campos de consulta, pet, cobrança etc.) está em `src/data/seed.js`: é o contrato que as telas esperam.
