import { IconUsers, IconUserShield } from "@tabler/icons-react";

// Mesmas páginas por perfil do protótipo do Figma
export const NAV = {
  recepcao: [
    { to: "/recepcao/pacientes", label: "Pacientes", icon: IconUsers },
  ],
  admin: [
    { to: "/admin/pacientes", label: "Pacientes", icon: IconUsers },
    { to: "/admin/usuarios", label: "Usuários", icon: IconUserShield },
  ],
};
