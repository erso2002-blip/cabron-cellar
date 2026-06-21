# MyCellar backup e restore

## Estado atual

- Existe backup diario do OpenClaw/workspace, mas ele nao substitui backup formal do banco.
- Em 2026-06-21 foi gerado um backup manual antes da adaptacao internacional.
- O backup manual inclui estrutura do projeto, Git bundle, dump completo do Postgres, schema SQL e checksums.
- O restore do dump foi testado em um Postgres 17 descartavel.
- Em 2026-06-21 foi ativado timer diario dedicado `mycellar-production-backup.timer`.

## Backup manual validado

Local:

`/root/.openclaw/workspace/backups/cabron-cellar/2026-06-21T0145Z/`

Arquivos:

- `cabron-cellar.git.bundle`: copia Git restauravel com referencias.
- `cabron-cellar-structure.tar.gz`: estrutura do projeto sem `.env`, `.git`, `node_modules`, `dist` e `build`.
- `mycellar-production-db.dump`: dump completo do banco em formato custom do Postgres.
- `mycellar-production-schema.sql`: schema SQL para auditoria rapida.
- `SHA256SUMS.txt`: checksums dos artefatos.

Validacao feita:

- `pg_restore` executado em container descartavel `postgres:17`.
- Restore concluiu e encontrou 7 tabelas publicas.

## Plano diario recomendado

Frequencia:

- Diario, uma vez por dia, fora de horario de uso intenso.
- Timer local atual: `mycellar-production-backup.timer`, `05:30 UTC`, com atraso aleatorio de ate 10 minutos.

Escopo:

- Git bundle do repositorio.
- Tar da estrutura sem segredos e sem dependencias pesadas.
- Dump completo do banco de producao.
- Dump do schema.
- Checksums.
- Teste minimo de restore pelo menos semanalmente.

Retencao:

- Local: 14 dias.
- Externa: 30 a 90 dias em storage privado com acesso restrito.
- Mensal: 6 a 12 snapshots mensais, se o app entrar em cobranca real.

Regras de seguranca:

- Nao salvar `.env` dentro do tar.
- Nao imprimir `DATABASE_URL` em logs.
- Tratar dumps como dados sensiveis.
- Nao enviar dump por Telegram.
- Qualquer copia externa deve ir para storage privado com controle de acesso.

## Restore operacional

Com `pg_restore` compativel com a versao do banco:

```bash
createdb mycellar_restore
pg_restore --no-owner --no-privileges -d mycellar_restore mycellar-production-db.dump
```

Para testar sem tocar em producao, usar container Postgres descartavel.

## Lacunas

- Falta escolher destino externo seguro para copia diaria.
- Falta definir alerta se o backup falhar.
- Falta rotina mensal de restore testado e registrado.
