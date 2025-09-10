export function validateAdminSecret(req: Request) {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    return { ok: false, message: 'ADMIN_API_SECRET not configured' };
  }
  const header = req.headers.get('x-admin-secret');
  if (!header || header !== secret) {
    return { ok: false, message: 'Unauthorized' };
  }
  return { ok: true };
}
