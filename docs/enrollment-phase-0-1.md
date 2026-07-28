# Enrollment Portal Implementation

## Scope

This implementation introduces an isolated enrollment domain alongside the legacy
marketing `class` table and LMS `courses` tables. New writes use:

- `enrollment_classes`
- `class_teachers`
- `applications`
- `user_roles`
- `class_groups`
- `class_memberships`
- `audit_logs`
- `notification_outbox`
- `idempotency_keys`
- `assignments`
- `submissions`
- `grades`
- `in_app_notifications`

Registration remains in `pre_students`. Acceptance promotes the candidate to
`users`, records `user_roles.student`, creates the active class membership,
increments the occupied seat, writes an audit event, and enqueues a notification
inside one database transaction.

## Setup

Tables are created idempotently on first use. They can also be prepared explicitly:

```bash
npm run setup-enrollment --workspace=admin-portal
```

All stored timestamps are UTC. UI formatting uses `Asia/Jakarta`.

## Rollback plan

Application rollback is safe: deploy the previous application version. The new
tables do not replace or modify the legacy class/LMS tables. Do not drop tables
until the data-retention window has passed.

If a database rollback is approved, export the new tables first, then drop them in
reverse dependency order:

1. `idempotency_keys`, `notification_outbox`, `audit_logs`
2. `class_memberships`, `applications`, `class_groups`, `class_teachers`
3. `user_roles`, `enrollment_classes`
4. Remove `pre_students.promoted_user_id` only after verifying it is unused

Never delete promoted `users` records automatically; they may own academic data.

## Operational checks

- `occupied_seats` must equal active memberships per class.
- Every accepted application must have `accepted_user_id` and an active membership.
- Outbox rows in `failed` state require retry/reconciliation.
- Admission acceptance requires an `Idempotency-Key`.

## Current API

Admin/teacher:

- `GET|POST /api/enrollment/classes`
- `GET|PATCH /api/enrollment/classes/:id`
- `POST /api/enrollment/classes/:id/transition`
- `GET /api/enrollment/classes/:id/members`
- `GET /api/enrollment/applications`
- `POST /api/enrollment/applications/:id/decision`

Student/pre-student:

- `GET /api/enrollment/classes`
- `GET /api/enrollment/classes/:id`
- `POST /api/enrollment/classes/:id/applications`
- `GET /api/enrollment/applications`
- `POST /api/enrollment/applications/:id/withdraw`
- `GET /api/enrollment/assignments`
- `POST /api/enrollment/assignments/:id/submissions`
- `GET /api/enrollment/submissions/:id/file`
- `GET /api/enrollment/notifications`

Teacher/admin:

- `GET|POST /api/enrollment/assignments`
- `POST /api/enrollment/assignments/:id/transition`
- `GET /api/enrollment/assignments/:id/submissions`
- `PUT /api/enrollment/submissions/:id/grade`
- `GET /api/enrollment/submissions/:id/file`
- `GET /api/enrollment/reports/academic`

PDF submission validates extension, MIME type, configured size limit, and `%PDF-`
magic bytes before upload. Files use private/no-store cache metadata and are read
through authorization-protected endpoints.
