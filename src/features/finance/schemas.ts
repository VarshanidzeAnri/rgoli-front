import { z } from 'zod'

import { PAYMENT_METHODS } from '@/lib/enums'

/** "1250", "1250.5", "1250.50" — decimal(12,2), positive. */
const money = z
  .string()
  .trim()
  .min(1, 'validation:required')
  .regex(/^\d{1,10}([.,]\d{1,2})?$/, 'validation:money')
  .transform((v) => v.replace(',', '.'))
  .refine((v) => Number(v) > 0, 'validation:positive')

export const salaryRequestSchema = z.object({
  project_id: z.string().min(1, 'validation:required'),
  title: z.string().trim().min(1, 'validation:required').max(200, 'validation:max'),
  amount: money,
  note: z.string().max(2000, 'validation:max'),
})
export type SalaryRequestValues = z.input<typeof salaryRequestSchema>

export const paymentSchema = z.object({
  project_id: z.string().min(1, 'validation:required'),
  amount: money,
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'validation:date'),
  method: z.enum(PAYMENT_METHODS),
  note: z.string().max(2000, 'validation:max'),
})
export type PaymentValues = z.input<typeof paymentSchema>
