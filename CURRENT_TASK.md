# CURRENT_TASK — Redesign premium do app (paleta, navbar, login e padronização geral)

**Complexidade:** 🔴 Grande — reformulação visual de todas as telas e componentes. Zero mudança de banco/lógica de negócio e zero rebuild nativo (tudo estilo/JS). Dividida em subtarefas com checkpoints visuais no emulador (claro + escuro).

---

## Objetivo

Elevar o app a um visual **premium de fintech**: paleta ancorada no **verde real dos ícones de categoria** (`#01763B`, extraído por amostragem dos PNGs), tipografia e espaçamentos padronizados, navbar corrigida (botão “+” hoje é **clipado** pela tab bar), login redesenhado com a **logo oficial** (`assets/d20_despesas.png`) e todas as seções coerentes entre si.

## Problemas apontados
1. Navbar com layout quebrado e **botão “+” cortado** (o `tabBarButton` usa `top:-16` e o container da tab bar clippa o excedente no Android).
2. **Login** básico: ícone genérico de carteira, sem logo, sem identidade.
3. Cores atuais (`#16A34A`/`#22C55E`) não conversam com o verde profundo dos ícones.
4. Falta padronização: raios, sombras, espaçamentos e cabeçalhos diferem entre telas/modais.

---

## Direção de design (decisões)

### Paleta “Verde Bandeira” (ancorada em #01763B)
- **Light:** `primary #01763B` · `primaryPressed #015B2E` · `primarySoft #E3F2E9` · bg `#F6F8F7` (off-white esverdeado) · surface `#FFFFFF` · surfaceAlt `#EFF3F0` · text `#111B14` · textMuted `#5C6B61` · border `#E2E8E4` · danger `#DC2626` · success `#01763B`.
- **Dark (fintech premium):** bg `#0A0F0C` (quase-preto esverdeado) · surface `#121A15` · surfaceAlt `#1A241E` · `primary #2FBF71` (verde vivo p/ contraste) · primarySoft `#123524` · text `#ECF2EE` · textMuted `#93A39A` · border `#233029`.
- `ThemeColors` ganha `primaryPressed`, `overlay` (backdrop), e sombras nomeadas.

### Tokens de design (novo `src/theme/tokens.ts`)
- **Espaçamento:** escala 4/8/12/16/20/24/32.
- **Raios:** `sm 10 · md 14 · lg 18 · xl 24 · pill 999`.
- **Tipografia:** display 32/800 · title 22/800 · heading 17/700 · body 15 · caption 12,5 · label 13/600 uppercase.
- **Sombra/elevação:** `card` (suave) e `floating` (FAB/modais) definidas uma vez e reusadas.

### Navbar (fix do corte + visual)
- Tab bar mais alta (~74 + safe area), fundo `surface`, borda superior hairline, labels 11/600.
- **FAB central desenhado FORA da tab bar** (absoluto no `TabsLayout`, acima da barra): nunca mais é clipado, sombra `floating` completa, anel de destaque. A rota `add` vira um espaçador invisível (mantém o slot do meio).
- Ícones: preenchidos quando ativos (wallet/chart-box/target/cog “-outline” quando inativos).

### Login premium
- Fundo em **gradiente verde profundo** (`expo-linear-gradient`, já instalado) com a **logo `d20_despesas.png`** em destaque (card circular com sombra), nome “D20 Despesas” + tagline.
- Botão Google **branco** padrão (logo “G” colorida via MCI + texto escuro), estados de loading/pressed, rodapé discreto (“Seus dados ficam só na sua conta”).

### Padronização de componentes
- `src/components/ScreenHeader.tsx` — título (display) + ação à direita; usado nas 4 tabs.
- `src/components/BottomSheet.tsx` — wrapper de modal (backdrop `overlay`, raio `xl` no topo, **handle** central, padding padrão); adotado por CategorySelect, ExpenseFiltersModal, GoalFormModal e CalendarModal.
- Cards: raio `lg`, borda hairline, sombra `card` — igual em Gráficos, Metas, sugestões e carrossel de insights.

### Telas (retoques com os tokens)
- **Despesas:** hero do total (label pequena + valor display, chip de variação), chips de período em pill `surfaceAlt`/primary, headers de dia mais discretos (label uppercase + total), itens com respiro maior.
- **Gráficos:** títulos de card padronizados (heading), legenda alinhada, mesmos raios/sombras em pizza/linha/patrimônio.
- **Metas:** cards de meta e sugestões no mesmo estilo; barra de progresso com track suave e cantos redondos.
- **Config:** seções com label uppercase, linhas com ícone em “badge” `primarySoft`, chevron, divisores hairline.
- **Form de despesa:** valor display centrado, inputs `surfaceAlt` sem borda dura (foco com anel primary), switches na cor primary — tudo com os tokens.

---

## Checklist

### Subtarefa 1 — Fundação (checkpoint ✅)
- [ ] `theme/tokens.ts` (spacing, radius, type, sombras)
- [ ] `theme/palette.ts` reancorado em `#01763B` (light + dark, campos novos)
- [ ] `components/ScreenHeader.tsx` e `components/BottomSheet.tsx`
- [ ] Navbar nova + **FAB central sem corte** (fora da tab bar)
- [ ] Login premium com logo + gradiente
- [ ] **Checkpoint:** screenshots login + navbar nos 2 temas

### Subtarefa 2 — Telas principais (checkpoint ✅)
- [ ] Despesas (hero, chips, day headers, itens)
- [ ] Gráficos (cards padronizados)
- [ ] Metas (metas + sugestões no padrão)
- [ ] Configurações (seções/linhas premium)
- [ ] **Checkpoint:** screenshots das 4 tabs nos 2 temas

### Subtarefa 3 — Form + sheets
- [ ] Form de despesa com tokens (valor, inputs, hint de meta)
- [ ] CategorySelect, ExpenseFiltersModal, GoalFormModal e CalendarModal no `BottomSheet` padrão
- [ ] Carrossel de insights alinhado (raio/sombra/margens)

### Validação
- [ ] `tsc --noEmit` limpo
- [ ] Emulador: claro + escuro em todas as telas; FAB inteiro (sem corte); login com logo; contraste legível

---

## Arquivos afetados (principais)
- `src/theme/palette.ts` (reancorada) · `src/theme/tokens.ts` (novo)
- `src/components/ScreenHeader.tsx`, `src/components/BottomSheet.tsx` (novos)
- `src/app/(app)/(tabs)/_layout.tsx` (navbar/FAB) · `(auth)/login.tsx` (redesign)
- `(tabs)/index.tsx`, `charts.tsx`, `goals.tsx`, `settings.tsx` · `(app)/expense/[id].tsx`
- `features/period/PeriodFilter.tsx` · `features/expenses/ExpenseItem.tsx`, `ExpenseFiltersModal.tsx` · `features/categories/CategorySelect.tsx` · `features/goals/GoalFormModal.tsx` · `features/insights/InsightsCarousel.tsx` · `features/stats/InsightCard.tsx` · `features/suggestions/SuggestionCard.tsx` · `features/investments/InvestmentChart.tsx` · `components/CalendarModal.tsx`

## Variáveis de ambiente
- Nenhuma nova. Sem rebuild nativo (gradiente já instalado).

## Critério de aceite
1. Botão “+” central **inteiro** (sem corte), navbar alinhada e elegante nos 2 temas.
2. Login com **logo oficial**, gradiente e botão Google padrão — visual de app publicado.
3. Paleta única ancorada no verde `#01763B` combinando com os ícones de categoria em **todas** as telas (claro e escuro).
4. Modais/bottom sheets com o mesmo padrão (handle, raio, backdrop) e cards com raio/sombra idênticos em todo o app.
5. Nenhuma regressão funcional (filtros, swipe, metas, sugestões, gráficos operando como antes).
6. `tsc --noEmit` limpo; screenshots de validação nos 2 temas.

## Link do Figma
- (nenhum informado)

## Ordem de execução
ST1 (fundação + navbar + login, checkpoint) → ST2 (telas, checkpoint) → ST3 (form/sheets) → validação final.
