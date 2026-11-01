import { IconUsers, IconUserShield } from "@tabler/icons-react";

// Mesmas páginas por perfil do protótipo do Figma
export const NAV = {
  recepcao: [
    { to: "/recepcao/cadastros", label: "Cadastros", icon: IconUsers },
  ],
  admin: [
    { to: "/admin/usuarios", label: "Usuários", icon: IconUserShield },
    { to: "/admin/cadastros", label: "Cadastros", icon: IconUsers },
  ],
};
