import {
  IconCalendarEvent, IconCalendarTime, IconCash, IconCoin, IconFileText, IconLayoutDashboard,
  IconNotes, IconPaw, IconPrescription, IconReportAnalytics, IconStethoscope, IconUsers,
  IconUserShield, IconVaccine,
} from '@tabler/icons-react';

// Mesmas páginas por perfil do protótipo do Figma
export const NAV = {
  tutor: [
    { to: '/tutor/pets', label: 'Meus pets', icon: IconPaw },
    { to: '/tutor/vacinas', label: 'Vacinas', icon: IconVaccine },
    { to: '/tutor/consultas', label: 'Consultas', icon: IconCalendarEvent },
    { to: '/tutor/receitas', label: 'Receitas', icon: IconFileText },
  ],
  recepcao: [
    { to: '/recepcao/agenda', label: 'Agenda', icon: IconCalendarTime },
    { to: '/recepcao/cadastros', label: 'Cadastros', icon: IconUsers },
    { to: '/recepcao/caixa', label: 'Caixa', icon: IconCash },
  ],
  vet: [
    { to: '/vet/atendimentos', label: 'Atendimentos', icon: IconStethoscope },
    { to: '/vet/prontuarios', label: 'Prontuários', icon: IconNotes },
    { to: '/vet/vacinas', label: 'Vacinas', icon: IconVaccine },
    { to: '/vet/prescricoes', label: 'Prescrições', icon: IconPrescription },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
    { to: '/admin/relatorios', label: 'Relatórios', icon: IconReportAnalytics },
    { to: '/admin/usuarios', label: 'Usuários', icon: IconUserShield },
    { to: '/admin/financeiro', label: 'Financeiro', icon: IconCoin },
  ],
};
