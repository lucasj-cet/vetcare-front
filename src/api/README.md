# Camada de API do front

As telas **nunca** chamam `fetch` direto: elas usam as funções de `index.js` (todas devolvem `Promise`).
Hoje essas funções respondem com os dados de demonstração guardados no navegador (`db.js` + `src/data/seed.js`).

Para ligar na API real:

1. Coloque o endereço da API em `.env` → `VITE_API_URL=https://...`
2. Em `index.js`, troque o corpo de cada função por uma chamada do `http.js`, mantendo o **mesmo formato de retorno**. Exemplo:

```js
// antes (demonstração)
list: ({ search } = {}) => call(() => db.all('tutors')...),
// depois
list: ({ search } = {}) => http.get('/tutors', { search }),
```

3. O token é guardado em `src/auth/session.jsx` (`tokenStore.set(res.token)` no `login`); `index.js` só faz as requisições. O `http.js` já manda `Authorization: Bearer` e lança `ApiError`; o redirecionamento para `/login` em 401 fica no handler global (`ApiErrorHandler`).
4. Quando todas as funções estiverem trocadas, apague `db.js` e `src/data/seed.js`.

Erros: se a API devolver `{ "message": "..." }`, o texto aparece no aviso vermelho da tela.

## Rotas sugeridas (uma por função)

| Função                                                 | Rota sugerida                                                                         | Quem usa                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------- |
| `auth.login({ email, password })`                      | `POST /auth/login` → `{ token, user }`                                                | Login                        |
| `auth.me()`                                            | `GET /users/me` → `{ name, email, role }`                                             | Sessão (ao recarregar)       |
| `auth.recover(email)`                                  | `POST /auth/forgot-password`                                                          | Login › Esqueci minha senha  |
| `staff.vets()`                                         | `GET /users?role=vet&status=ativo`                                                    | Agenda, formulários          |
| `staff.list()`                                         | `GET /users?scope=staff`                                                              | Admin › Usuários             |
| `staff.invite(data)`                                   | `POST /users/invite`                                                                  | Admin › Convidar usuário     |
| `staff.resendInvite(id)`                               | `POST /users/:id/invite`                                                              | Admin › Usuários             |
| `staff.update(id, patch)`                              | `PATCH /users/:id` (perfil, status)                                                   | Admin › Usuários             |
| `petOwners.list({ search, page })`                     | `GET /pet-owners?search=&page=` → `{ data, total, page, pageSize }` (com `pets[]`)    | Recepção › Cadastros         |
| `petOwners.get(id)`                                    | `GET /pet-owners/:id` (com `pets[]`; 404 se não existir ou foi excluído)              | Ficha do tutor               |
| `petOwners.create(data)`                               | `POST /pet-owners` (aceita `pets[]` junto; 409 se o CPF já existir) → `PetOwner`      | Cadastro de tutor e pet      |
| `petOwners.update(id, data)`                           | `PATCH /pet-owners/:id` com `{ name, phone, email, address }` (CPF não é editável)    | Editar tutor                 |
| `tutors.remove(id)`                                    | `DELETE /tutors/:id` (409 se tiver consulta marcada)                                  | Excluir tutor                |
| `pets.list({ search, page })`                          | `GET /pets?search=&page=` → `{ data, total, page, pageSize }` (com `petOwner`)        | Recepção › Cadastros         |
| `pets.profile(id)`                                     | `GET /pets/:id/profile` (registros, vacinas, prescrições, exames, próximas consultas) | Prontuário, Ficha, Portal    |
| `pets.save(data)`                                      | `POST /pets` · `PUT /pets/:id`                                                        | Cadastro de pet              |
| `pets.remove(id)`                                      | `DELETE /pets/:id`                                                                    | Excluir pet                  |
| `appointments.range(from, to)`                         | `GET /appointments?from=&to=`                                                         | Agenda (dia/semana)          |
| `appointments.requests()`                              | `GET /appointments?status=solicitada`                                                 | Agenda › Pedidos dos tutores |
| `appointments.get(id)`                                 | `GET /appointments/:id`                                                               | Detalhes da consulta         |
| `appointments.forVet(vetId, date)`                     | `GET /appointments?vetId=&date=`                                                      | Veterinário › Atendimentos   |
| `appointments.forTutor(tutorId)`                       | `GET /tutors/:id/appointments`                                                        | Portal › Consultas           |
| `appointments.slots({ date, vetId, type })`            | `GET /appointments/slots?date=&vetId=&type=`                                          | Formulário de agendamento    |
| `appointments.create(data)`                            | `POST /appointments`                                                                  | Recepção › Novo agendamento  |
| `appointments.request(data)`                           | `POST /appointments/requests`                                                         | Portal › Agendar consulta    |
| `appointments.update(id, data)`                        | `PUT /appointments/:id`                                                               | Remarcar                     |
| `appointments.confirmRequest(id, vetId)`               | `POST /appointments/:id/confirm`                                                      | Agenda › Confirmar pedido    |
| `appointments.setStatus(id, status, reason)`           | `PATCH /appointments/:id/status`                                                      | Chegada, cancelar, recusar   |
| `appointments.cancelByTutor(id)`                       | `POST /appointments/:id/cancel`                                                       | Portal › Cancelar            |
| `care.start(id)`                                       | `POST /appointments/:id/start`                                                        | Iniciar atendimento          |
| `care.finish(id, { record, prescription })`            | `POST /appointments/:id/finish`                                                       | Concluir atendimento         |
| `records.create(data)`                                 | `POST /pets/:id/records`                                                              | Prontuário › Novo registro   |
| `charges.pending()`                                    | `GET /charges?status=pendente`                                                        | Caixa                        |
| `charges.paidOn(date)`                                 | `GET /charges?status=pago&date=`                                                      | Caixa                        |
| `charges.pay(id, { method, installments })`            | `POST /charges/:id/pay`                                                               | Registrar pagamento          |
| `charges.createPaid(data)`                             | `POST /charges` (lançamento avulso)                                                   | Registrar pagamento › Avulso |
| `vaccines.list()`                                      | `GET /vaccines`                                                                       | Veterinário › Vacinas        |
| `vaccines.forTutor(tutorId)`                           | `GET /tutors/:id/vaccines`                                                            | Portal › Vacinas             |
| `vaccines.apply(data)`                                 | `POST /vaccines/apply`                                                                | Registrar aplicação          |
| `reminders.forTutor(tutorId)` / `reminders.save(data)` | `GET /tutors/:id/reminders` · `PUT /pets/:id/reminder`                                | Portal › Lembrete de vacina  |
| `prescriptions.list()`                                 | `GET /prescriptions`                                                                  | Veterinário › Prescrições    |
| `prescriptions.save(data)`                             | `POST /prescriptions` · `PUT /prescriptions/:id`                                      | Nova prescrição / rascunho   |
| `documents.forTutor(tutorId)`                          | `GET /tutors/:id/documents`                                                           | Portal › Receitas            |
| `dashboard.overview()`                                 | `GET /dashboard/overview`                                                             | Admin › Dashboard            |
| `finance.month('YYYY-MM')`                             | `GET /finance?month=`                                                                 | Admin › Financeiro           |
| `finance.add(data)` / `finance.remove(id)`             | `POST /finance/movements` · `DELETE /finance/movements/:id`                           | Nova movimentação            |
| `reports.list()` / `reports.generate(params)`          | `GET /reports` · `POST /reports`                                                      | Admin › Relatórios           |
| `notifications.list(viewer)` / `markAllRead(viewer)`   | `GET /notifications` · `POST /notifications/read`                                     | Avisos (todos os perfis)     |

O formato de cada objeto (campos de consulta, pet, cobrança etc.) está em `src/data/seed.js`: é o contrato que as telas esperam.
