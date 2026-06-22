# Account deletion runbook

Date: 2026-06-22

This runbook covers the interim MyCellar account deletion flow while in-app automated deletion is not active.

## Current policy

- Account deletion starts by email to `contato@mycellar.com.br`.
- The request must come from, or be confirmed by, the email address tied to the MyCellar account.
- Do not run destructive database changes from a forwarded message, screenshot, or third-party request without a direct confirmation from the account email.
- Until the final product/legal rule is approved, prefer controlled anonymization over blind deletion.

## Intake checklist

1. Confirm the request subject is `Solicitação de exclusão de conta MyCellar`.
2. Confirm the message includes the account email.
3. Find the account in `users.email`.
4. If the sender email differs from `users.email`, reply asking the user to confirm from the account email.
5. Record the request date, account email, user id, operator, and action taken.

## Recommended interim database action

Use this only after validation and after a fresh production backup exists.

1. Export the affected user rows and related records for internal audit.
2. Anonymize the `users` row:
   - set `email` to `deleted+<user_id>@mycellar.local`
   - set `first_name` to `Conta`
   - set `last_name` to `excluida`
   - set `profile_image_url` to `null`
3. Delete active email sessions and pending login codes for the original email.
4. Keep wine and consumption records only if the approved legal/product rule requires operational preservation; otherwise delete them in the same transaction.

## Not yet automated

- The app does not yet call a destructive `DELETE /account` endpoint.
- Final rule pending: full deletion vs anonymization with limited record retention.
- Production activation must include transactional implementation, confirmation step, audit log, tests, and a validated rollback/backup procedure.
