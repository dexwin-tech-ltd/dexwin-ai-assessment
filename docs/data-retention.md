# Data retention

Retention exists to limit blast radius, not to keep everything "just in case."
Default to the shortest window that still supports debugging and audit.

- Production **access logs**: retained **90 days**, then deleted.
- Application debug logs: retained **30 days**.
- Customer backups: retained **365 days** (rolling).
- Deleted workspace data: **30-day soft delete**, then hard delete. Legal hold
  can pause deletion; only Legal can set a hold.

Do not copy production data to laptops. Staging may use scrubbed snapshots.
If a regulator or customer asks for a longer hold, file a ticket with Legal
before changing any retention job.
