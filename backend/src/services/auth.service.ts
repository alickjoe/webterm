import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { dbGet, dbPut } from './db.service';
import { User, UserCreateInput, JwtPayload } from '../types';
import { logger } from './logger.service';

const BCRYPT_ROUNDS = 12;

export async function createUser(input: UserCreateInput): Promise<User> {
  // Check if username already exists
  const existingId = await dbGet(`user:username:${input.username}`);
  if (existingId) {
    throw new Error('Username already exists');
  }

  // Check if email already exists
  const existingEmailId = await dbGet(`user:email:${input.email}`);
  if (existingEmailId) {
    throw new Error('Email already exists');
  }

  const id = uuidv4();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const now = new Date().toISOString();

  const user: User = {
    id,
    username: input.username,
    email: input.email,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  // Store user data
  await dbPut(`user:${id}`, JSON.stringify(user));
  // Store username index
  await dbPut(`user:username:${input.username}`, id);
  // Store email index
  await dbPut(`user:email:${input.email}`, id);

  logger.info({ userId: id, username: input.username }, 'User created');
  return user;
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  const userId = await dbGet(`user:username:${username}`);
  if (!userId) {
    throw new Error('Invalid credentials');
  }

  const userData = await dbGet(`user:${userId}`);
  if (!userData) {
    throw new Error('Invalid credentials');
  }

  const user: User = JSON.parse(userData);
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user);
  logger.info({ userId: user.id }, 'User authenticated');
  return { user, token };
}

export async function getUserById(id: string): Promise<User | null> {
  const data = await dbGet(`user:${id}`);
  if (!data) return null;
  return JSON.parse(data);
}

export function generateToken(user: User): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    username: user.username,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as string,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
