import { COLORS } from './theme';

export const DEPARTMENT_CODES = {
  ADM: 'ADM',
  REG: 'REG',
  TRS: 'TRS',
  SCH: 'SCH',
  HLP: 'HLP',
} as const;

export type DepartmentCode = keyof typeof DEPARTMENT_CODES;

export interface DepartmentMeta {
  prefix: string;
  name: string;
  icon: string;
  color: string;
}

export const DEPARTMENTS: Record<DepartmentCode, DepartmentMeta> = {
  ADM: { prefix: 'A', name: 'Admissions', icon: 'graduation-cap', color: COLORS.primary },
  REG: { prefix: 'R', name: 'Registrar', icon: 'file-text', color: COLORS.primaryLight },
  TRS: { prefix: 'T', name: 'Treasury', icon: 'landmark', color: COLORS.accent },
  SCH: { prefix: 'S', name: 'Scholarships', icon: 'dollar-sign', color: COLORS.success },
  HLP: { prefix: 'H', name: 'Help Desk', icon: 'help-circle', color: COLORS.textSecondary },
} as const;

export const getDepartmentByPrefix = (prefix: string): DepartmentMeta | undefined =>
  Object.values(DEPARTMENTS).find((d) => d.prefix === prefix);

export const getDepartmentByCode = (code: string): DepartmentMeta | undefined =>
  DEPARTMENTS[code as DepartmentCode];
