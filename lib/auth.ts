import { cookies } from 'next/headers';
import { db } from './db';
import crypto from 'crypto';

const COOKIE_NAME = 'agri_session';
const SESSION_EXPIRY_DAYS = 7;

const SCRYPT_KEYLEN = 64;

// Hash a password using scrypt with a unique, random per-user salt.
// Stored format: `scrypt$<saltHex>$<hashHex>`. scrypt is a slow, memory-hard
// KDF built into Node's crypto module, so no external dependency is needed.
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

// Legacy hashing (SHA-256 + static salt). Retained ONLY to verify accounts that
// were created before the scrypt migration; never used to create new hashes.
function legacyHashPassword(password: string): string {
  const salt = process.env.SESSION_SECRET || 'agriconnect-default-salt-value-2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Verify a password against a stored hash, supporting both the new scrypt format
// and the legacy SHA-256 format. Comparisons are timing-safe. When a legacy hash
// matches, `needsUpgrade` is true so the caller can transparently re-hash it.
export function verifyPassword(
  password: string,
  stored: string,
): { valid: boolean; needsUpgrade: boolean } {
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    const salt = parts[1];
    const hashHex = parts[2];
    if (!salt || !hashHex) return { valid: false, needsUpgrade: false };
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(hashHex, 'hex');
    const valid =
      expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
    return { valid, needsUpgrade: false };
  }

  // Legacy SHA-256 path.
  const legacy = Buffer.from(legacyHashPassword(password));
  const storedBuf = Buffer.from(stored);
  const valid =
    legacy.length === storedBuf.length && crypto.timingSafeEqual(legacy, storedBuf);
  return { valid, needsUpgrade: valid };
}

export async function createSession(userId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionId) return null;

  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            farmName: true,
            farmDetails: true,
            address: true,
            isBlocked: true,
          },
        },
      },
    });

    if (!session) return null;

    if (new Date() > session.expiresAt) {
      // Session expired, clean up
      await db.session.delete({ where: { id: sessionId } });
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    if (session.user.isBlocked) {
      // User is blocked, terminate session
      await db.session.delete({ where: { id: sessionId } });
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;
  if (sessionId) {
    try {
      await db.session.delete({ where: { id: sessionId } });
    } catch (error) {
      // Ignored if session already deleted
    }
    cookieStore.delete(COOKIE_NAME);
  }
}
