import { createTheme } from '@mantine/core';

// Escada do teal da marca (#0d9488 é o tom 7). O teal cheio vai só em marcas pequenas:
// botão principal, séries de dados, ícone ativo. Os tons claros carregam as áreas.
const teal = [
  '#e4f7f5', '#c9eee9', '#a1e0d8', '#70cec3', '#45bbae',
  '#22a89a', '#139a8d', '#0d9488', '#087f76', '#066a62',
];

export const theme = createTheme({
  primaryColor: 'teal',
  primaryShade: 8,
  colors: { teal },
  black: '#132a2d',
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.5rem', lineHeight: '1.25' },
      h2: { fontSize: '0.9375rem', lineHeight: '1.4' },
      h3: { fontSize: '0.875rem', lineHeight: '1.4' },
    },
  },
  defaultRadius: 'sm',
  radius: { xs: '4px', sm: '6px', md: '8px', lg: '10px', xl: '14px' },
  cursorType: 'pointer',
  components: {
    Badge: {
      defaultProps: { variant: 'light', radius: 'sm', size: 'md' },
      styles: { root: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 } },
    },
    Modal: {
      defaultProps: { radius: 'md', centered: true, overlayProps: { backgroundOpacity: 0.4 } },
      styles: { title: { fontWeight: 600, fontSize: '1rem' } },
    },
    Drawer: {
      defaultProps: { position: 'right', size: 'md', overlayProps: { backgroundOpacity: 0.3 } },
      styles: { title: { fontWeight: 600, fontSize: '1rem' } },
    },
    Tabs: { defaultProps: { color: 'teal' } },
    Table: { defaultProps: { verticalSpacing: 'sm', horizontalSpacing: 'md' } },
    SegmentedControl: { defaultProps: { radius: 'sm' } },
  },
});
