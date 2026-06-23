# Mercado Pago - MyCellar

Integração preparada para assinaturas recorrentes via endpoint `/preapproval` do Mercado Pago.

## Planos

- Free: R$ 0, ate 30 garrafas.
- Pro Mensal promocional de lançamento: de R$ 39,90 por R$ 19,90/mês.
- Pro Anual promocional de lançamento: de R$ 399,00 por R$ 199,00/ano.

## Variáveis de ambiente

- `MERCADO_PAGO_ACCESS_TOKEN`: access token da aplicação Mercado Pago.
- `MYCELLAR_PUBLIC_URL`: URL pública canônica do app, ex. `https://mycellar.com.br`.
- `MERCADO_PAGO_WEBHOOK_URL`: URL pública do webhook, ex. `https://mycellar.com.br/api/billing/mercado-pago/webhook`.
- `MERCADO_PAGO_WEBHOOK_SECRET`: segredo de assinatura gerado no painel de Webhooks do Mercado Pago.

## Estado Atual

- O app lista os planos em `/billing`.
- O checkout pago cria uma assinatura Mercado Pago em status `pending`, grava a assinatura localmente e redireciona o usuário para o `init_point`.
- O webhook `POST /api/billing/mercado-pago/webhook` registra o evento, consulta `/preapproval/{id}` no Mercado Pago e atualiza a assinatura local.
- O benefício Pro é liberado apenas quando a assinatura local estiver `active`, derivada de status Mercado Pago `authorized`.
- O front ainda mantém botões pagos bloqueados até publicação controlada e teste ponta a ponta.
- Não inserir credenciais no código ou em arquivo commitado.

## Teste controlado

1. Publicar a versão com webhook em produção.
2. Configurar `MERCADO_PAGO_WEBHOOK_URL` e `MERCADO_PAGO_WEBHOOK_SECRET` na Vercel.
3. Configurar/simular evento `subscription_preapproval` no painel do Mercado Pago.
4. Criar checkout com usuário de teste autenticado.
5. Confirmar `GET /api/billing/status`: começa `free`/`pending` e só vira `pro` após status autorizado.
6. Confirmar acesso Pro em uma rota bloqueada, como harmonização ou limite de garrafas.
