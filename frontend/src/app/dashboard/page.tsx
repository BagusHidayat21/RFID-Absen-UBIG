    "use client";

    import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from "@/utils/supabase/client"
    import { Card, CardContent, CardHeader } from '@/components/ui/card';
    import { Badge } from '@/components/ui/badge';
    import { Clock, Calendar, User, BookOpen, Users, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

    // Types
    interface Siswa {
        id: string;
        nama_siswa: string;
        nis: string;
        rfid_uid: string;
        kelas_id: string;
        jurusan_id: string;
        pararel_id: string;
    }

    interface Kelas {
        id: string;
        nama_kelas: string;
    }

    interface Jurusan {
        id: string;
        nama_jurusan: string;
    }

    interface Pararel {
        id: string;
        nama_pararel: string;
    }

    interface Absensi {
        id: string;
        siswa_id: string;
        tanggal_absen: string;
        jam_masuk: string;
        jam_pulang: string;
        status: string;
        keterangan: string;
        siswa: Siswa & {
            kelas: Kelas;
            jurusan: Jurusan;
            pararel: Pararel;
        };
    }

    export default function RealtimeAttendanceDisplay() {
        const [currentAttendance, setCurrentAttendance] = useState<Absensi | null>(null);
        const [isVisible, setIsVisible] = useState(false);
        const [currentTime, setCurrentTime] = useState(new Date());
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [lastInsertedId, setLastInsertedId] = useState<string | null>(null);

        const supabaseClient = supabase;

        // Update current time
        useEffect(() => {
            const timer = setInterval(() => {
                setCurrentTime(new Date());
            }, 1000);
            return () => clearInterval(timer);
        }, []);

        // Fetch latest attendance data with useCallback to prevent infinite re-renders
        const fetchLatestAttendance = useCallback(async () => {
            try {
                setError(null);

                // Get the latest attendance record with related data
                const { data, error } = await supabaseClient
                    .from('absensi')
                    .select(`
            *,
            siswa:siswa_id (
                *,
                kelas:kelas_id (
                id,
                nama_kelas
                ),
                jurusan:jurusan_id (
                id,
                nama_jurusan
                ),
                pararel:pararel_id (
                id,
                nama_pararel
                )
            )
            `)
                    .order('jam_masuk', { ascending: false }) // Gunakan created_at jika tersedia, atau jam_masuk
                    .limit(1)
                    .single();

                if (error) {
                    console.error('Error fetching attendance:', error);
                    // Jika tidak ada data, jangan set error
                    if (error.code !== 'PGRST116') {
                        setError('Error fetching attendance data');
                    }
                    return;
                }

                if (data && data.siswa) {
                    // Transform data to match our interface
                    const transformedData: Absensi = {
                        id: data.id,
                        siswa_id: data.siswa_id,
                        tanggal_absen: data.tanggal_absen,
                        jam_masuk: data.jam_masuk,
                        jam_pulang: data.jam_pulang || '',
                        status: data.status,
                        keterangan: data.keterangan || '',
                        siswa: {
                            ...data.siswa,
                            kelas: data.siswa.kelas,
                            jurusan: data.siswa.jurusan,
                            pararel: data.siswa.pararel
                        }
                    };

                    // Hanya update jika data berbeda
                    if (transformedData.id !== lastInsertedId) {
                        setCurrentAttendance(transformedData);
                        setLastInsertedId(transformedData.id);

                        // Trigger animation
                        setIsVisible(false);
                        setTimeout(() => {
                            setIsVisible(true);
                        }, 100);
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setError('An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        }, [lastInsertedId, supabaseClient]);

        // Set up real-time subscription
        useEffect(() => {
            console.log('Setting up real-time subscription...');

            // Initial fetch
            fetchLatestAttendance();

            // Subscribe to real-time changes - fokus pada INSERT events
            const channel = supabaseClient
                .channel('realtime-attendance')
                .on('postgres_changes', {
                    event: 'INSERT', // Fokus pada INSERT saja
                    schema: 'public',
                    table: 'absensi'
                }, (payload) => {
                    console.log('New attendance record inserted:', payload);
                    // Fetch the latest data when new record is inserted
                    setTimeout(() => {
                        fetchLatestAttendance();
                    }, 500); // Small delay to ensure data is fully committed
                })
                .on('postgres_changes', {
                    event: 'UPDATE', // Juga handle UPDATE jika diperlukan
                    schema: 'public',
                    table: 'absensi'
                }, (payload) => {
                    console.log('Attendance record updated:', payload);
                    setTimeout(() => {
                        fetchLatestAttendance();
                    }, 500);
                })
                .subscribe((status) => {
                    console.log('Subscription status:', status);
                });

            return () => {
                console.log('Cleaning up subscription...');
                supabaseClient.removeChannel(channel);
            };
        }, [fetchLatestAttendance, supabaseClient]);

        // Fallback: Periodic refresh every 1 seconds (lebih sering untuk testing)
        useEffect(() => {
            const interval = setInterval(() => {
                console.log('Periodic refresh...');
                fetchLatestAttendance();
            }, 5000);

            return () => clearInterval(interval);
        }, [fetchLatestAttendance]);

        const getStatusIcon = (status: string) => {
            switch (status.toLowerCase()) {
                case 'hadir':
                    return <CheckCircle className="w-6 h-6 text-green-600" />;
                case 'terlambat':
                    return <AlertCircle className="w-6 h-6 text-yellow-600" />;
                case 'izin':
                    return <XCircle className="w-6 h-6 text-blue-600" />;
                case 'sakit':
                    return <XCircle className="w-6 h-6 text-red-600" />;
                case 'alpha':
                    return <XCircle className="w-6 h-6 text-gray-600" />;
                default:
                    return <CheckCircle className="w-6 h-6 text-green-600" />;
            }
        };

        const getStatusBadge = (status: string) => {
            switch (status.toLowerCase()) {
                case 'hadir':
                    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hadir</Badge>;
                case 'terlambat':
                    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Terlambat</Badge>;
                case 'izin':
                    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Izin</Badge>;
                case 'sakit':
                    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Sakit</Badge>;
                case 'alpha':
                    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Alpha</Badge>;
                default:
                    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Hadir</Badge>;
            }
        };

        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatTime = (timeString: string) => {
            if (!timeString) return '';

            // If it's already in HH:MM:SS format, return as is
            if (timeString.includes(':')) {
                return timeString;
            }

            // If it's a full datetime, extract time
            const time = new Date(timeString).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            return time;
        };

        const generateAvatarUrl = (name: string) => {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dc2626&color=fff&size=128&rounded=true&font-size=0.6`;
        };

        // Loading state
        if (isLoading) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
                        <p className="text-red-700 text-lg font-medium">Memuat data absensi...</p>
                        <div className="mt-2 w-20 h-1 bg-red-200 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-red-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            );
        }

        // Error state
        if (error) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100 flex items-center justify-center">
                    <div className="text-center bg-white rounded-2xl shadow-xl p-8 border border-red-200">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 text-lg mb-4 font-medium">{error}</p>
                        <button
                            onClick={() => {
                                setIsLoading(true);
                                setError(null);
                                fetchLatestAttendance();
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            );
        }

        // No data state
        if (!currentAttendance) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100">
                    {/* Header */}
                    <header className="w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500 shadow-lg border-b fixed top-0 left-0 z-50">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">
                                    Sistem Absensi Realtime
                                </h1>
                                <p className="text-red-100 text-sm font-medium">SMK Negeri 1 Malang</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-red-50">
                                <div className="flex items-center gap-2 bg-red-700/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">
                                        {currentTime.toLocaleDateString("id-ID", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 bg-red-700/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono font-bold">{currentTime.toLocaleTimeString("id-ID")}</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* No data content */}
                    <div className="pt-20 p-4 min-h-screen flex items-center justify-center">
                        <div className="text-center bg-white rounded-3xl shadow-2xl p-12 border border-red-100">
                            <div className="relative">
                                <Clock className="w-24 h-24 text-red-300 mx-auto mb-6" />
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-ping"></div>
                            </div>
                            <p className="text-red-700 text-xl mb-2 font-bold">Menunggu data absensi...</p>
                            <p className="text-red-500 text-lg">Sistem siap menerima absensi siswa</p>
                            <div className="mt-6 text-sm text-red-400 bg-red-50 rounded-lg p-3 border border-red-200">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    Real-time connection aktif
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="fixed bottom-6 right-6">
                        <div className="bg-white rounded-full shadow-2xl p-4 border border-red-200">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-red-700 font-bold">Live</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-red-100">
                {/* Header */}
                <header className="w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-500 shadow-lg border-b fixed top-0 left-0 z-50">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">
                                Sistem Absensi Realtime
                            </h1>
                            <p className="text-red-100 text-sm font-medium">SMK Negeri 1 Malang</p>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-red-50">
                            <div className="flex items-center gap-2 bg-red-700/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">
                                    {currentTime.toLocaleDateString("id-ID", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-red-700/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold">{currentTime.toLocaleTimeString("id-ID")}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content with proper spacing */}
                <div className="pt-20 px-0 py-0 bg-gradient-to-br from-red-50/80 via-white to-rose-50/60 overflow-hidden">
                    <div
                        className={`w-full max-w-full mx-auto h-full flex flex-col transform transition-all duration-700 ease-in-out ${isVisible
                            ? "scale-100 opacity-100 translate-y-0"
                            : "scale-95 opacity-0 translate-y-4"
                            }`}
                    >
                        <Card className="flex-1 bg-white shadow-none border-0 overflow-hidden flex flex-col w-full h-full">
                            {/* Content */}
                            <CardContent className="p-0 flex flex-col lg:flex-row flex-1 bg-gradient-to-br from-white via-red-50/20 to-rose-50/30 overflow-hidden w-full h-full">
                                {/* Foto siswa section */}
                                <div className="relative flex items-center justify-center lg:w-1/3 w-full p-6 overflow-hidden">
                                    <div className="relative w-full aspect-[3/4] max-h-[400px] mx-auto">
                                        <img
                                            src="/images/foto1.jpg"
                                            alt={currentAttendance.siswa.nama_siswa}
                                            className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-900/60 via-red-500/20 to-transparent rounded-2xl"></div>
                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                            <User className="w-5 h-5 text-red-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Detail siswa section */}
                                <div className="flex-1 p-6 relative overflow-y-auto">
                                    {/* Background decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100/50 to-transparent rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-100/50 to-transparent rounded-full blur-2xl"></div>

                                    <div className="relative z-10 space-y-6">
                                        {/* Header section */}
                                        <div className="border-b border-red-200/60 pb-6">
                                            <h3 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-3 tracking-tight leading-tight">
                                                {currentAttendance.siswa.nama_siswa}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                <p className="text-red-600 text-base font-semibold">Siswa SMK Negeri 1 Malang</p>
                                            </div>
                                        </div>

                                        {/* Information grid */}
                                        <div className="grid grid-cols-6 gap-4">
                                            {/* NIS Card */}
                                            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 rounded-2xl p-5 shadow-lg border border-red-100/60 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-red-300/60 col-span-6 md:col-span-3">
                                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center gap-4">
                                                    <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300 shadow-md">
                                                        <CreditCard className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-red-500 font-semibold mb-1 uppercase tracking-wide">Nomor Induk Siswa</div>
                                                        <div className="font-bold text-xl text-red-800 tracking-wide">
                                                            {currentAttendance.siswa.nis}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Kelas Card */}
                                            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 rounded-2xl p-5 shadow-lg border border-rose-100/60 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-rose-300/60 col-span-6 md:col-span-3">
                                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center gap-4">
                                                    <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl group-hover:from-rose-200 group-hover:to-rose-300 transition-all duration-300 shadow-md">
                                                        <User className="w-5 h-5 text-rose-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-rose-500 font-semibold mb-1 uppercase tracking-wide">Kelas</div>
                                                        <div className="font-bold text-xl text-rose-800">
                                                            {currentAttendance.siswa.kelas?.nama_kelas}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Jurusan Card */}
                                            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 rounded-2xl p-5 shadow-lg border border-red-100/60 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-red-300/60 col-span-6 md:col-span-3">
                                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center gap-4">
                                                    <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300 shadow-md">
                                                        <BookOpen className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-red-500 font-semibold mb-1 uppercase tracking-wide">Jurusan</div>
                                                        <div className="font-bold text-xl text-red-800">
                                                            {currentAttendance.siswa.jurusan?.nama_jurusan} - {currentAttendance.siswa.pararel?.nama_pararel}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status Card */}
                                            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 rounded-2xl p-5 shadow-lg border border-rose-100/60 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-rose-300/60 col-span-6 md:col-span-3">
                                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center gap-4">
                                                    <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl group-hover:from-rose-200 group-hover:to-rose-300 transition-all duration-300 shadow-md">
                                                        {getStatusIcon(currentAttendance.status)}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-rose-500 font-semibold mb-1 uppercase tracking-wide">Status Kehadiran</div>
                                                        <div className="font-bold text-xl text-rose-800">
                                                            {currentAttendance.status.charAt(0).toUpperCase() + currentAttendance.status.slice(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Waktu Card */}
                                            <div className="group relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 rounded-2xl p-5 shadow-lg border border-red-100/60 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-red-300/60 col-span-6">
                                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="relative flex items-center gap-4">
                                                    <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 rounded-xl group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300 shadow-md">
                                                        <Clock className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-red-500 font-semibold mb-1 uppercase tracking-wide">Waktu Absen</div>
                                                        <div className="font-bold text-2xl text-red-800 tracking-wide font-mono">
                                                            {formatTime(currentAttendance.jam_masuk)} WIB
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional info */}
                                        <div className="pt-4 border-t border-red-200/60">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2 bg-green-50 rounded-full px-4 py-2 border border-green-200">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span className="font-semibold text-green-700">Absensi berhasil tercatat</span>
                                                </div>
                                                <div className="font-mono text-sm bg-red-100 px-4 py-2 rounded-full border border-red-200 text-red-700 font-semibold">
                                                    {formatDate(currentAttendance.tanggal_absen)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Status Indicator - dengan informasi lebih detail */}
                <div className="fixed bottom-6 right-6">
                    <div className="bg-white rounded-full shadow-2xl p-4 border border-red-200">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-red-700 font-bold">Live</span>
                        </div>
                    </div>
                </div>

                {/* Debug info - hapus di production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-6 left-6 bg-red-900 bg-opacity-90 text-red-100 p-3 rounded-lg text-xs shadow-xl border border-red-700">
                        <div className="font-mono">Last ID: {lastInsertedId}</div>
                        <div className="font-mono">Current ID: {currentAttendance?.id}</div>
                    </div>
                )}
            </div>
        );
    }