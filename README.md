# Next.js Migration (Phase 2 Complete)

This folder now contains the migrated Next.js app for all legacy pages and endpoints found in the repository.

## Migrated Pages

1. `/login` (from `view/login.php`)
2. `/` Feed In (from `view/index.php`)
3. `/confirmCFeedIn` (from `view/confirmCFeedIn.php`)
4. `/confirmCFeedOut` (from `view/confirmCFeedOut.php`)
5. `/productionReport` (from `view/productionReport.php`)

## Migrated APIs

1. `POST /api/login` <- `model/login.php`
2. `POST /api/user` <- `model/getUser.php`
3. `POST /api/qr` <- `model/getQr.php`
4. `POST /api/qr-confirmed` <- `model/getQrConfirmed.php`
5. `POST /api/rawmat-cor3` <- `model/checkRawMatCor3.php`
6. `POST /api/confirm-qrs` <- `model/confirmQrs.php`
7. `POST /api/group-machine-by-reason` <- `model/getGroupMachineByReasonCode.php`
8. `GET /api/reason-c-feed-in` <- `model/getReasonCFeedInPL.php`
9. `POST /api/wip-confirmed-by-date` <- `model/getWipConfirmedByDate.php`
10. `POST /api/fg-by-date` <- `model/getFgBydate.php`
11. `POST /api/ac-output-by-batch` <- `model/getACOutputByBatch.php`
12. `POST /api/grade-c-confirmed-detail` <- `model/getGradeCConfirmedDetail.php`
13. `POST /api/rawmat-batch-by-processorder` <- `model/getRawmatBatchByProcessorder.php`
14. `POST /api/confirm-grade-c-wip` <- `model/confirmGradeCWip.php`
15. `POST /api/confirm-grade-c-fg` <- `model/confirmGradeCFg.php`
16. `POST /api/cancel-row-grade-c` <- `model/cancelRowGradeC.php`
17. `POST /api/cancel-row-grade-c-fg` <- `model/cancelRowGradeCFg.php`

## Legacy Missing Endpoints (Stubbed)

These PHP files were referenced but not present in repository, so compatibility stubs are added:

1. `POST /api/check-in` -> returns `501`
2. `POST /api/image` -> returns `501`
3. `GET /api/top200-checkin` -> returns `501`

## Environment

1. Copy `.env.example` to `.env.local`
2. Fill SQL Server and SAP values
3. Run:
   - `npm install`
   - `npm run dev`

## Notes

- Legacy PHP source remains unchanged for side-by-side verification.
- Database and SAP credentials are now environment-based (no `config.php` dependency).
