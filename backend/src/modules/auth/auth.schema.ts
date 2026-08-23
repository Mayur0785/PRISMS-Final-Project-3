import { z } from 'zod';

const emailOrPhone = z
  .string()
  .min(3, 'Email or Mobile Number is too short')
  .refine(
    (val) => {
      const trimmed = val.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const isPhone = /^[6-9]\d{9}$/.test(trimmed.replace(/[\s-+()]/g, ''));
      return isEmail || isPhone;
    },
    {
      message: 'Please enter a valid email address or 10-digit mobile number',
    }
  );

export const registerSchema = z.object({
  body: z.object({
    email: emailOrPhone,
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().optional(),
    role: z.enum(['farmer', 'buyer', 'fpo', 'advisor']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailOrPhone,
    password: z.string().min(1, 'Password is required'),
  }),
});

