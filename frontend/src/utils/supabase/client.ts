import { createBrowserClient } from "@supabase/ssr"

// Create client function for consistency with server
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Export instance for direct use
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types untuk database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
      }
      kelas: {
        Row: {
          id: string
          nama_kelas: string
          created_at: string
        }
        Insert: {
          id?: string
          nama_kelas: string
          created_at?: string
        }
        Update: {
          id?: string
          nama_kelas?: string
          created_at?: string
        }
      }
      jurusan: {
        Row: {
          id: string
          nama_jurusan: string
          created_at: string
        }
        Insert: {
          id?: string
          nama_jurusan: string
          created_at?: string
        }
        Update: {
          id?: string
          nama_jurusan?: string
          created_at?: string
        }
      }
      pararel: {
        Row: {
          id: string
          nama_pararel: string
          created_at: string
        }
        Insert: {
          id?: string
          nama_pararel: string
          created_at?: string
        }
        Update: {
          id?: string
          nama_pararel?: string
          created_at?: string
        }
      }
      siswa: {
        Row: {
          id: string
          nama_siswa: string
          nis: string
          rfid_uid: string | null
          kelas_id: string | null
          jurusan_id: string | null
          pararel_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nama_siswa: string
          nis: string
          rfid_uid?: string | null
          kelas_id?: string | null
          jurusan_id?: string | null
          pararel_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nama_siswa?: string
          nis?: string
          rfid_uid?: string | null
          kelas_id?: string | null
          jurusan_id?: string | null
          pararel_id?: string | null
          created_at?: string
        }
      }
      absensi: {
        Row: {
          id: string
          siswa_id: string
          tanggal_absen: string
          jam_masuk: string | null
          jam_pulang: string | null
          status: 'izin' | 'alpha' | 'terlambat' | 'sakit' | 'hadir'
          keterangan: string | null
          created_at: string
        }
        Insert: {
          id?: string
          siswa_id: string
          tanggal_absen?: string
          jam_masuk?: string | null
          jam_pulang?: string | null
          status?: 'izin' | 'alpha' | 'terlambat' | 'sakit' | 'hadir'
          keterangan?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          siswa_id?: string
          tanggal_absen?: string
          jam_masuk?: string | null
          jam_pulang?: string | null
          status?: 'izin' | 'alpha' | 'terlambat' | 'sakit' | 'hadir'
          keterangan?: string | null
          created_at?: string
        }
      }
    }
  }
}