// Regra de senha forte. A API deve aplicar a mesma regra ao aceitar um convite.
export const PASSWORD_RULE =
  "A senha precisa ter pelo menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo";

export const isStrongPassword = (v = "") =>
  v.length >= 8 &&
  /[a-z]/.test(v) &&
  /[A-Z]/.test(v) &&
  /\d/.test(v) &&
  /[^A-Za-z0-9]/.test(v);
