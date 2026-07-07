'use server';

import { db } from '../db';
import { hashPassword, createSession, destroySession } from '../auth';

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string;
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

    const hashedPassword = hashPassword(password);
    if (hashedPassword !== user.password) {
      return { success: false, error: 'Invalid email or password.' };
    }

    await createSession(user.id);
    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function signup(state: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
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
