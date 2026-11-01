export type Specialization = 'vocals' | 'guitar' | 'bass' | 'drums' | 'keys' | 'other'

export interface ProfileData {
  first_name?: string
  specialization?: Specialization
  specialization_display?: string
  bio?: string
  fee?: string
}

export interface UserProfile {
  id: number
  username: string
  profile: ProfileData
}

export interface Credentials {
  username: string
  password: string
}

