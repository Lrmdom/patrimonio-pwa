# 🎨 Sanity Visual Editing - Guia Completo

## 📋 Pré-requisitos

### ✅ Variáveis de Ambiente Configuradas:
```bash
# .env ou .env.local
VITE_SANITY_STUDIO_PROJECT_ID="acaezt04"
VITE_SANITY_STUDIO_DATASET="production"
VITE_SANITY_STUDIO_URL="https://catalogopatrimonio.sanity.studio"
SANITY_VIEWER_TOKEN="skr6KohuYf2WPOLx4qLLDQmCkb2Wn0XlFphThIwKa2QLv5lQ3A6Xe9WduxEQraIh5kyLC3SFmk4Sf6CLHDOBfKZMEHrf6S3NvBm0qvG2Y61VfdgsAzS8DGopr5OjUCTUblBzi1q9KBQML4AUcIXv7uj7HnqX67wUvyyQzFFolRj50kP0y9q7"
```

### ✅ Dependências Instaladas:
```bash
npm install @sanity/client @sanity/visual-editing @sanity/preview-url-secret @sanity/react-loader --legacy-peer-deps
```

## 🚀 Como Ativar o Visual Editing

### Método 1: Presentation Tool (Recomendado)

1. **Abra o Sanity Studio:**
   ```
   https://catalogopatrimonio.sanity.studio
   ```

2. **Navegue até Presentation Tool:**
   - Clique no ícone de apresentação (geralmente no topo)
   - Ou acesse: `https://catalogopatrimonio.sanity.studio/presentation`

3. **Configure a URL:**
   - URL do frontend: `http://localhost:5173/heritage-simple`
   - O Presentation Tool vai automaticamente:
     - Ativar preview mode
     - Definir cookies necessários
     - Redirecionar para sua página

4. **Teste o Visual Editing:**
   - Passe o mouse sobre elementos (títulos, descrições)
   - Deve aparecer outline azul
   - Clique para editar no Studio

### Método 2: Manual (Para Debug)

1. **Ative Preview Mode Manualmente:**
   ```
   http://localhost:5173/api/preview-mode/enable?secret=SEU_SECRET
   ```

2. **Verifique se Funciona:**
   - Debug panel deve mostrar "Preview Mode: ✅"
   - Elementos devem ter hover effects

## 🔍 Debug e Troubleshooting

### Debug Panel Info:
```
🔍 Sanity Debug
Project ID: acaezt04
Dataset: production
Studio URL: https://catalogopatrimonio.sanity.studio
Stega Enabled: ✅
Preview Mode: ❌/✅
```

### Se Não Funcionar:

#### ❌ "Stega Enabled: ❌"
- **Problema:** Cliente Sanity não configurado corretamente
- **Solução:** Verifique variáveis de ambiente no client.ts

#### ❌ "Preview Mode: ❌"
- **Problema:** Preview mode não ativado
- **Solução:** Use Presentation Tool ou endpoint manual

#### ❌ Sem hover effects
- **Problema:** Visual Editing não está ativo
- **Solução:** Verifique se `<VisualEditing />` está sendo renderizado

#### ❌ Erro "Objects are not valid as a React child"
- **Problema:** Query retornando arrays internacionalizados
- **Solução:** Query já está corrigida com `title[_key == "pt"][0].value`

## 🎯 Como Funciona o Visual Editing

### 1. **Content Source Maps (Stega):**
- Codifica URLs nos dados do Sanity
- Permite click-to-edit direto no frontend
- Funciona apenas em preview mode

### 2. **Preview Mode:**
- Ativa via cookies
- Permite ver dados em draft
- Habilita overlays de edição

### 3. **Visual Editing Component:**
- `<VisualEditing />` adiciona overlays
- Apenas ativo em preview mode
- Detecta hover e clique em elementos

## 📱 Teste Completo

### Passo 1: Verificação Inicial
```bash
# 1. Inicie o servidor
npm run dev

# 2. Acesse a página
http://localhost:5173/heritage-simple

# 3. Verifique debug panel (canto inferior esquerdo)
```

### Passo 2: Ativar Preview Mode
```bash
# Via Presentation Tool (recomendado)
https://catalogopatrimonio.sanity.studio/presentation

# Ou manualmente (se tiver o secret)
http://localhost:5173/api/preview-mode/enable?secret=...
```

### Passo 3: Testar Visual Editing
```bash
# 1. Passe mouse sobre títulos
# 2. Deve aparecer outline azul
# 3. Clique para editar no Studio
# 4. Verifique se abre o campo correto
```

## 🛠️ Componentes Envolvidos

### Frontend:
- `app/root.tsx` - Layout com ENV injection
- `app/routes/heritage-simple.tsx` - Página com Visual Editing
- `app/components/DebugVisualEditing.tsx` - Debug panel

### Sanity:
- `app/sanity/client.ts` - Cliente com Stega
- `app/sanity/session.ts` - Preview mode management
- `app/sanity/loader.server.ts` - Server-side data loading

### API:
- `app/routes/api.preview-mode.enable.tsx` - Ativa preview
- `app/routes/api.preview-mode.disable.tsx` - Desativa preview

## 🎨 Esperado Ver

### Modo Normal:
- Sem overlays
- Sem hover effects
- Debug panel: "Preview Mode: ❌"

### Preview Mode:
- Overlays azuis no hover
- Click-to-edit funcional
- Debug panel: "Preview Mode: ✅"
- Botão "Sair do modo de edição"

---

**Lembre-se:** O Visual Editing só funciona quando ativado via Presentation Tool ou preview mode!
