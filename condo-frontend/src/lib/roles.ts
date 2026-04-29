export const Role = {
  SuperUser: 'SuperUser',
  Admin: 'Admin',
  Resident: 'Resident',
} as const

export type RoleName = (typeof Role)[keyof typeof Role]
