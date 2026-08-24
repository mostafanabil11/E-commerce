import * as bcrypt from 'bcrypt';

const SALT = Number(process.env.SALT_ROUNDS);

export const hash = async (plainText: string): Promise<string> => {
  return bcrypt.hash(plainText, SALT);
};

export const compareHash = async (
  plainText: string,
  hashedText: string,
): Promise<boolean> => {
  return bcrypt.compare(plainText, hashedText);
};