# Como formatar seus dados para importar no D20 Despesas

O D20 Despesas **não tem um botão de "importar arquivo"** — o cadastro de despesas é feito um a um, pelo formulário do app. Mas isso não significa que você precisa digitar tudo "no olho" a partir de um extrato bagunçado.

O jeito mais rápido de usar qualquer fonte de dados (extrato do banco, fatura do cartão, planilha antiga, anotações do WhatsApp, etc.) é:

1. Copiar os dados brutos da sua fonte (extrato, PDF, planilha, print, o que for).
2. Pedir para uma IA (Claude, ChatGPT, etc.) organizar esses dados no formato descrito abaixo.
3. Usar essa lista organizada como um "checklist" para cadastrar cada despesa no app rapidinho, sem ter que reler o extrato inteiro toda hora.

Este arquivo existe justamente para você **colar junto com seus dados brutos** ao pedir essa organização para uma IA. Algo como:

> "Aqui está meu extrato do mês. Formata esses dados seguindo as regras do arquivo `formato_dados_do_d20_despesas.md`."

---

## Campos que toda despesa precisa ter

| Campo | Obrigatório? | Formato esperado | Exemplo |
|---|---|---|---|
| **Descrição** | Sim | Texto curto, livre | `iFood almoço`, `Aluguel julho`, `Farmácia` |
| **Valor** | Sim | Número positivo, em reais, com 2 casas decimais. **Nunca use valor negativo** | `45,90` |
| **Data** | Sim | Data da transação, formato `dd/mm/aaaa` | `06/07/2026` |
| **Categoria** | Sim | Uma das categorias existentes no app (ver lista abaixo) | `Mercado` |
| **Status** | Sim | `Pago` ou `Não pago` | `Pago` |
| **Recorrente?** | Opcional | `Sim` ou `Não` — se marcar como recorrente, o app já cria a próxima ocorrência do mês seguinte | `Não` |

> ⚠️ **Importante sobre o valor**: no D20 Despesas não existe o conceito de "receita" (dinheiro entrando). O app controla apenas despesas (dinheiro saindo). Então, ao formatar um extrato bancário que tenha entradas e saídas misturadas, **peça para a IA remover ou ignorar as entradas/receitas** e te entregar só a lista de despesas, sempre com valor positivo.

---

## Categorias disponíveis

Use (ou peça para a IA usar) uma destas categorias padrão do app sempre que possível:

- Entretenimento
- Comida & iFood
- Lazer & Social
- Contas de casa
- Saúde
- Transporte
- Diversos
- Mercado
- Impostos
- Eletrônicos
- Assinaturas
- Investimentos
- Cartões
- Faculdade

Se nenhuma categoria fizer sentido para um gasto, use **Diversos**. Você também pode criar categorias novas direto no app, se preferir.

---

## Formato de saída recomendado

Peça para a IA te entregar os dados já formatados como uma lista simples, um item por despesa, assim:

```
1. Descrição: Mercado do mês
   Valor: 380,00
   Data: 03/07/2026
   Categoria: Mercado
   Status: Pago
   Recorrente: Não

2. Descrição: Netflix
   Valor: 39,90
   Data: 05/07/2026
   Categoria: Assinaturas
   Status: Pago
   Recorrente: Sim

3. Descrição: Consulta médica
   Valor: 200,00
   Data: 06/07/2026
   Categoria: Saúde
   Status: Não pago
   Recorrente: Não
```

Esse formato é só para facilitar sua leitura enquanto você digita no app — não existe importação automática desse texto, então depois de organizado, é só abrir o D20 Despesas, tocar no botão **"+"** e cadastrar cada item da lista, um por um.

---

## Casos especiais

- **Despesa parcelada** (ex.: compra em 10x no cartão): no app, cadastre como um parcelamento — informe o valor total e o número de parcelas, que o app já divide e lança as ocorrências dos meses seguintes. Não é necessário (nem recomendado) pedir para a IA já dividir o valor por parcela.
- **Despesa recorrente** (ex.: aluguel, assinaturas mensais): marque `Recorrente: Sim` no formato acima e, no app, ative a opção de recorrência ao cadastrar — assim você não precisa recadastrar todo mês.

---

## Resumo rápido para copiar e colar em qualquer IA

> "Organize os dados abaixo em uma lista de despesas, um item por linha, com os campos: Descrição, Valor (em reais, sempre positivo, 2 casas decimais), Data (dd/mm/aaaa), Categoria (uma destas: Entretenimento, Comida & iFood, Lazer & Social, Contas de casa, Saúde, Transporte, Diversos, Mercado, Impostos, Eletrônicos, Assinaturas, Investimentos, Cartões, Faculdade — use 'Diversos' se nenhuma servir), Status (Pago ou Não pago) e Recorrente (Sim/Não). Ignore entradas/receitas, mostre só despesas. Dados: [cole aqui seu extrato/planilha/anotações]"
