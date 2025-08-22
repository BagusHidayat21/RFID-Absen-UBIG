"use client";

import { useState, useEffect } from 'react';
import AdminLayout from "@/components/Layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, Calendar, FileText } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

// Types
interface Siswa {
  id: string;
  nama_lengkap: string;
  nis: string;
  kelas_id?: string;
  jurusan_id?: string;
  pararel_id?: string;
}

interface Absensi {
  id: string;
  siswa_id: string;
  tanggal_absen: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  status: string;
  keterangan: string | null;
  siswa: Siswa;
}

interface RingkasanHarian {
  hari: string;
  persentase: number;
}

interface DashboardData {
  totalSiswa: number;
  hadirHariIni: number;
  terlambat: number;
  tidakHadir: number;
  aktivitasTerbaru: Absensi[];
  ringkasanMingguan: RingkasanHarian[];
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSiswa: 0,
    hadirHariIni: 0,
    terlambat: 0,
    tidakHadir: 0,
    aktivitasTerbaru: [],
    ringkasanMingguan: []
  });
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Ambil total siswa
      const { count: totalSiswa } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true });

      // Ambil data absensi hari ini
      const today = new Date().toISOString().split('T')[0];
      
      const { data: absensiHariIni } = await supabase
        .from('absensi')
        .select(`
          *,
          siswa (
            nama_lengkap
          )
        `)
        .eq('tanggal_absen', today);

      // Hitung statistik
      const hadirHariIni = absensiHariIni?.filter((a: any) => 
        ['hadir', 'terlambat'].includes(a.status)
      ).length || 0;
      
      const terlambat = absensiHariIni?.filter((a: any) => 
        a.status === 'terlambat'
      ).length || 0;

      const totalSiswaCount = totalSiswa || 0;
      const tidakHadir = totalSiswaCount - hadirHariIni;

      // Ambil aktivitas terbaru (5 data terakhir)
      const { data: aktivitasTerbaru } = await supabase
        .from('absensi')
        .select(`
          *,
          siswa (
            nama_lengkap
          )
        `)
        .order('tanggal_absen', { ascending: false })
        .order('jam_masuk', { ascending: false })
        .limit(5);

      // Ambil data ringkasan mingguan (7 hari terakhir)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 6);
      
      const { data: absensiMingguan } = await supabase
        .from('absensi')
        .select('tanggal_absen, status')
        .gte('tanggal_absen', weekAgo.toISOString().split('T')[0])
        .lte('tanggal_absen', today);

      // Proses data mingguan
      const ringkasanMingguan: RingkasanHarian[] = [];
      const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = namaHari[date.getDay()];
        
        const absensiHari = absensiMingguan?.filter((a: any) => a.tanggal_absen === dateStr) || [];
        const hadirHari = absensiHari.filter((a: any) => ['hadir', 'terlambat'].includes(a.status)).length;
        const persentase = totalSiswaCount > 0 ? Math.round((hadirHari / totalSiswaCount) * 100) : 0;
        
        ringkasanMingguan.push({
          hari: dayName,
          persentase: persentase
        });
      }

      // Map aktivitas terbaru dengan proper typing
      const mappedAktivitas: Absensi[] = (aktivitasTerbaru || []).map((item: any) => ({
        id: item.id,
        siswa_id: item.siswa_id,
        tanggal_absen: item.tanggal_absen,
        jam_masuk: item.jam_masuk,
        jam_pulang: item.jam_pulang,
        status: item.status,
        keterangan: item.keterangan,
        siswa: {
          id: item.siswa?.id || '',
          nama_lengkap: item.siswa?.nama_lengkap || 'Nama tidak ditemukan',
          nis: item.siswa?.nis || '',
          kelas_id: item.siswa?.kelas_id,
          jurusan_id: item.siswa?.jurusan_id,
          pararel_id: item.siswa?.pararel_id
        }
      }));

      setDashboardData({
        totalSiswa: totalSiswaCount,
        hadirHariIni,
        terlambat,
        tidakHadir,
        aktivitasTerbaru: mappedAktivitas,
        ringkasanMingguan
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return '--:--';
    return timeString.slice(0, 5); // Ambil HH:MM dari HH:MM:SS
  };

const getStatusColor = (status: string): string => {
    switch (status) {
      case 'hadir': return 'success';
      case 'terlambat': return 'warning';
      case 'sakit': return 'info';
      case 'izin': return 'info';
      case 'alpha': return 'error';
      default: return 'success';
    }
  };

  const getActionText = (absensi: Absensi): string => {
    if (absensi.jam_masuk && absensi.jam_pulang) {
      return 'Absen lengkap';
    } else if (absensi.jam_masuk) {
      return 'Absen masuk';
    } else if (absensi.status === 'izin') {
      return 'Izin tidak masuk';
    } else if (absensi.status === 'sakit') {
      return 'Sakit';
    } else {
      return 'Alpha';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Memuat data dashboard...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
          <p className="text-slate-600">Selamat datang di panel admin sistem absensi</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-blue-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Siswa</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardData.totalSiswa.toLocaleString()}</p>
                <p className="text-xs text-slate-500">Siswa terdaftar</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-green-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Hadir Hari Ini</p>
                <p className="text-2xl font-bold text-green-600">{dashboardData.hadirHariIni}</p>
                <p className="text-xs text-slate-500">
                  {dashboardData.totalSiswa > 0 
                    ? Math.round((dashboardData.hadirHariIni / dashboardData.totalSiswa) * 100) 
                    : 0}% dari total
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-amber-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Terlambat</p>
                <p className="text-2xl font-bold text-amber-600">{dashboardData.terlambat}</p>
                <p className="text-xs text-slate-500">
                  {dashboardData.hadirHariIni > 0 
                    ? Math.round((dashboardData.terlambat / dashboardData.hadirHariIni) * 100) 
                    : 0}% dari hadir
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-red-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Tidak Hadir</p>
                <p className="text-2xl font-bold text-red-600">{dashboardData.tidakHadir}</p>
                <p className="text-xs text-slate-500">
                  {dashboardData.totalSiswa > 0 
                    ? Math.round((dashboardData.tidakHadir / dashboardData.totalSiswa) * 100) 
                    : 0}% dari total
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border border-blue-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Aktivitas Terbaru</h3>
            <div className="space-y-3">
              {dashboardData.aktivitasTerbaru.length > 0 ? (
                dashboardData.aktivitasTerbaru.map((aktivitas, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      getStatusColor(aktivitas.status) === 'success' ? 'bg-green-500' :
                      getStatusColor(aktivitas.status) === 'warning' ? 'bg-amber-500' :
                      getStatusColor(aktivitas.status) === 'info' ? 'bg-blue-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {aktivitas.siswa?.nama_lengkap || 'Nama tidak ditemukan'}
                      </p>
                      <p className="text-xs text-slate-500">{getActionText(aktivitas)}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatTime(aktivitas.jam_masuk || aktivitas.jam_pulang)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>Belum ada aktivitas hari ini</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-white border border-blue-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Ringkasan Mingguan</h3>
            <div className="space-y-4">
              {dashboardData.ringkasanMingguan.map((data, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{data.hari}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-200 rounded-full">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{width: `${Math.min(data.persentase, 100)}%`}}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">
                      {data.persentase}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}