import { z } from 'zod'

import { nullable } from '@/lib/forms'
import { DISCIPLINES, STATUSES } from '@/lib/enums'
import type { Project } from '@/types/api'

import type { ProjectInput } from '../api'

export const MONEY = /^\d{1,10}(\.\d{1,2})?$/
const EMAIL = z.email()

const optionalNumber = (max: number) =>
  z.string().refine((v) => v.trim() === '' || (Number.isFinite(Number(v)) && Math.abs(Number(v)) <= max), 'validation:number')

/**
 * All inputs stay strings in the form; `toProjectInput` converts them for the API.
 * `requireBudget` is false when editing without finance.view (budget fields are hidden).
 */
export const makeProjectSchema = (requireBudget = true) =>
  z
  .object({
    key: z.string().trim().regex(/^[A-Z][A-Z0-9]{1,9}$/, 'validation:projectKey'),
    name: z.string().trim().min(1, 'validation:required').max(200, 'validation:max'),
    client_name: z.string().trim().min(1, 'validation:required').max(160, 'validation:max'),
    client_phone: z.string().max(40, 'validation:max'),
    client_email: z.string().refine((v) => v.trim() === '' || EMAIL.safeParse(v.trim()).success, 'validation:email'),
    address: z.string().max(255, 'validation:max'),
    discipline: z.enum(DISCIPLINES),
    status: z.enum(STATUSES),
    budget: requireBudget ? z.string().trim().regex(MONEY, 'validation:money') : z.string(),
    discount_price: z.string().refine((v) => v.trim() === '' || MONEY.test(v.trim()), 'validation:money'),
    progress: z.string().refine((v) => v.trim() === '' || (/^\d{1,3}$/.test(v.trim()) && Number(v) <= 100), 'validation:maxValue'),
    start_date: z.string(),
    end_date: z.string(),
    lat: optionalNumber(90),
    lng: optionalNumber(180),
    description: z.string().max(10000, 'validation:max'),
  })
  .refine((v) => !v.start_date || !v.end_date || v.end_date >= v.start_date, {
    path: ['end_date'],
    message: 'validation:endAfterStart',
  })

export type ProjectFormValues = z.infer<ReturnType<typeof makeProjectSchema>>

export const emptyProjectValues: ProjectFormValues = {
  key: '',
  name: '',
  client_name: '',
  client_phone: '',
  client_email: '',
  address: '',
  discipline: 'architecture',
  status: 'todo',
  budget: '',
  discount_price: '',
  progress: '0',
  start_date: '',
  end_date: '',
  lat: '',
  lng: '',
  description: '',
}

export function projectToValues(p: Project): ProjectFormValues {
  return {
    key: p.key,
    name: p.name,
    client_name: p.client_name,
    client_phone: p.client_phone ?? '',
    client_email: p.client_email ?? '',
    address: p.address ?? '',
    discipline: p.discipline,
    status: p.status,
    budget: p.finance?.budget ?? '',
    discount_price: p.finance?.discount_price ?? '',
    progress: String(p.progress),
    start_date: p.start_date ?? '',
    end_date: p.end_date ?? '',
    lat: p.lat === null ? '' : String(p.lat),
    lng: p.lng === null ? '' : String(p.lng),
    description: p.description ?? '',
  }
}

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))

export function toProjectInput(v: ProjectFormValues): ProjectInput {
  return {
    key: v.key.trim(),
    name: v.name.trim(),
    client_name: v.client_name.trim(),
    client_phone: nullable(v.client_phone),
    client_email: nullable(v.client_email),
    address: nullable(v.address),
    discipline: v.discipline,
    status: v.status,
    budget: v.budget.trim(),
    discount_price: nullable(v.discount_price),
    progress: num(v.progress) ?? 0,
    start_date: nullable(v.start_date),
    end_date: nullable(v.end_date),
    lat: num(v.lat),
    lng: num(v.lng),
    description: nullable(v.description),
  }
}
