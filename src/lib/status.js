// Rótulos e cores dos estados. As pílulas usam o tom claro da cor com texto escuro do mesmo tom.

export const APPT_STATUS = {
  solicitada: { label: 'Solicitada', color: 'yellow' },
  agendada: { label: 'Agendada', color: 'blue' },
  aguardando: { label: 'Aguardando', color: 'orange' },
  em_atendimento: { label: 'Em atendimento', color: 'teal' },
  concluida: { label: 'Concluída', color: 'gray' },
  cancelada: { label: 'Cancelada', color: 'red' },
};

export const VACCINE_STATUS = {
  aplicada: { label: 'Aplicada', color: 'teal' },
  atrasada: { label: 'Atrasada', color: 'red' },
  proxima: { label: 'Em breve', color: 'orange' },
  agendada: { label: 'Agendada', color: 'blue' },
};

export const CHARGE_STATUS = {
  pago: { label: 'Pago', color: 'teal' },
  pendente: { label: 'A receber', color: 'orange' },
};

export const USER_STATUS = {
  ativo: { label: 'Ativo', color: 'teal' },
  convite: { label: 'Convite pendente', color: 'yellow' },
  inativo: { label: 'Desativado', color: 'gray' },
};

export const RX_STATUS = {
  emitida: { label: 'Emitida', color: 'teal' },
  rascunho: { label: 'Rascunho', color: 'gray' },
};

export const ROLE_LABEL = {
  tutor: 'Tutor',
  recepcao: 'Recepcionista',
  vet: 'Veterinário',
  admin: 'Administrador',
};
