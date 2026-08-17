import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashSecret(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifySecret(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
