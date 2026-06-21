# Mercado Pago - MyCellar

Integração preparada para assinaturas recorrentes via endpoint `/preapproval` do Mercado Pago.

## Planos

- Free: R$ 0, ate 30 garrafas.
- Pro Mensal promocional de lançamento: de R$ 39,90 por R$ 20,35/mês.
- Pro Anual promocional de lançamento: de R$ 399,00 por R$ 203,49/ano.

## Variáveis de ambiente

- `MERCADO_PAGO_ACCESS_TOKEN`: access token da aplicação Mercado Pago.
- `MYCELLAR_PUBLIC_URL`: URL pública canônica do app, ex. `https://mycellar.com.br`.
- `MERCADO_PAGO_WEBHOOK_URL`: opcional; URL pública de webhook quando a confirmação automática de assinatura for implementada.

## Estado Atual

- O app lista os planos em `/billing`.
- O checkout pago cria uma assinatura Mercado Pago em status `pending` e redireciona o usuário para o `init_point`.
- A ativação automática de benefício Pro ainda depende de webhook/consulta de status e persistência de assinatura por usuário.
- Não inserir credenciais no código ou em arquivo commitado.
