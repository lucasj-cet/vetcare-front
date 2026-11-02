import { IconUsers, IconUserShield } from "@tabler/icons-react";

// Mesmas páginas por perfil do protótipo do Figma
export const NAV = {
  RECEP: [{ to: "/recepcao/pacientes", label: "Pacientes", icon: IconUsers }],
  ADMIN: [
    { to: "/admin/pacientes", label: "Pacientes", icon: IconUsers },
    { to: "/admin/usuarios", label: "Usuários", icon: IconUserShield },
  ],
};
