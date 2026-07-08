'use server';

import { db } from '../db';
import { hashPassword, verifyPassword, createSession, destroySession } from '../auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Return shape used by useActionState-driven forms (login/signup).
type AuthActionState = { success: boolean; error?: string; role?: string } | null;

export async function login(state: AuthActionState, formData: FormData) {
  const email = ((formData.get('email') as string) || '').toLowerCase().trim();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.isBlocked) {
      return { success: false, error: 'Your account has been blocked for policy violations.' };
    }

    const { valid, needsUpgrade } = verifyPassword(password, user.password);
    if (!valid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    // Transparently migrate legacy SHA-256 hashes to scrypt on successful login.
    if (needsUpgrade) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { password: hashPassword(password) },
        });
      } catch (upgradeError) {
        console.error('Password hash upgrade failed:', upgradeError);
      }
    }

    await createSession(user.id);
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function signup(state: AuthActionState, formData: FormData) {
  const name = formData.get('name') as string;
  const email = ((formData.get('email') as string) || '').toLowerCase().trim();
  const password = formData.get('password') as string;
  const role = formData.get('role') as 'BUYER' | 'FARMER';
  
  // Farmer specific
  const farmName = formData.get('farmName') as string;
  const farmDetails = formData.get('farmDetails') as string;
  
  // Address
  const address = formData.get('address') as string;

  if (!name || !email || !password || !role) {
    return { success: false, error: 'Required fields are missing.' };
  }

  // Security: never trust a client-supplied role. Only self-registration as
  // BUYER or FARMER is allowed; ADMIN (or any other value) is rejected so a
  // crafted request cannot escalate privileges by submitting role=ADMIN.
  if (role !== 'BUYER' && role !== 'FARMER') {
    return { success: false, error: 'Invalid account type.' };
  }

  // Basic input validation.
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const hashedPassword = hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        farmName: role === 'FARMER' ? farmName || `${name}'s Farm` : null,
        farmDetails: role === 'FARMER' ? farmDetails || '' : null,
        address: address || '',
      },
    });

    await createSession(user.id);
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function logout() {
  await destroySession();
  return { success: true };
}
