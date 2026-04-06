#!/bin/bash
# Sync reservations for Feb-Apr 2026 via the deployed API
curl -s -X POST "https://sunstreet-one.vercel.app/api/sync" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2026-02-01", "endDate": "2026-04-30"}'
