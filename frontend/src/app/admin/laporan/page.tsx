"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Download, Search, Filter, Users, Clock, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/Layout/Sidebar";

// Types
interface Siswa {
    id: string;
    nama_siswa: string;
    nis: string;
    kelas?: { id: string; nama_kelas: string };
    jurusan?: { id: string; nama_jurusan: string };
    pararel?: { id: string; nama_pararel: string };
}

interface Absensi {
    id: string;
    siswa_id: string;
    tanggal_absen: string;
    jam_masuk: string;
    jam_pulang: string | null;
    status: string;
    keterangan: string;
    siswa: Siswa;
}

interface FilterOptions {
    startDate: string;
    endDate: string;
    kelas: string;
    status: string;
}

interface ReportSummary {
    total: number;
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpha: number;
}

export default function AdminAttendanceReport() {
    const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
    const [kelasList, setKelasList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [search, setSearch] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    
    // Filter states
    const [filters, setFilters] = useState<FilterOptions>({
        startDate: new Date().toISOString().split('T')[0], // Today
        endDate: new Date().toISOString().split('T')[0],   // Today
        kelas: "",
        status: ""
    });

    const [reportSummary, setReportSummary] = useState<ReportSummary>({
        total: 0,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        alpha: 0
    });

    useEffect(() => {
        fetchKelas();
        fetchAbsensi();
    }, []);

    useEffect(() => {
        fetchAbsensi();
    }, [filters]);

    // GET Kelas for filter
    const fetchKelas = async () => {
        const { data, error } = await supabase
            .from("kelas")
            .select("*")
            .order("nama_kelas");
        
        if (!error && data) {
            setKelasList(data);
        }
    };

    // GET Absensi with filters
    const fetchAbsensi = async () => {
        setIsLoading(true);
        
        let query = supabase
            .from("absensi")
            .select(`
                *,
                siswa:siswa_id (
                    *,
                    kelas:kelas_id ( id, nama_kelas ),
                    jurusan:jurusan_id ( id, nama_jurusan ),
                    pararel:pararel_id ( id, nama_pararel )
                )
            `);

        // Apply date filters
        if (filters.startDate) {
            query = query.gte("tanggal_absen", filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte("tanggal_absen", filters.endDate);
        }
        
        // Apply status filter
        if (filters.status) {
            query = query.eq("status", filters.status);
        }

        query = query.order("tanggal_absen", { ascending: false })
                    .order("jam_masuk", { ascending: false });

        const { data, error } = await query;

        if (!error && data) {
            let filteredData = data.map((absen: any) => ({
                id: absen.id,
                siswa_id: absen.siswa_id,
                tanggal_absen: absen.tanggal_absen,
                jam_masuk: absen.jam_masuk,
                jam_pulang: absen.jam_pulang,
                status: absen.status,
                keterangan: absen.keterangan,
                siswa: {
                    ...absen.siswa,
                    kelas: absen.siswa?.kelas,
                    jurusan: absen.siswa?.jurusan,
                    pararel: absen.siswa?.pararel,
                },
            }));

            // Apply class filter
            if (filters.kelas) {
                filteredData = filteredData.filter((absen: Absensi) => 
                    absen.siswa?.kelas?.id === filters.kelas
                );
            }

            setAbsensiList(filteredData);
            
            // Calculate summary
            const summary = {
                total: filteredData.length,
                hadir: filteredData.filter(a => a.status.toLowerCase() === "hadir").length,
                terlambat: filteredData.filter(a => a.status.toLowerCase() === "terlambat").length,
                izin: filteredData.filter(a => a.status.toLowerCase() === "izin").length,
                sakit: filteredData.filter(a => a.status.toLowerCase() === "sakit").length,
                alpha: filteredData.filter(a => a.status.toLowerCase() === "alpha").length,
            };
            setReportSummary(summary);
        }
        setIsLoading(false);
    };

    // Export to CSV
    const exportToCSV = async () => {
        setIsExporting(true);
        
        try {
            const csvHeaders = [
                "Tanggal",
                "Nama Siswa",
                "NIS",
                "Kelas",
                "Jam Masuk",
                "Jam Pulang",
                "Status",
                "Keterangan"
            ];

            const csvData = filteredList.map(absen => [
                formatDate(absen.tanggal_absen),
                absen.siswa?.nama_siswa || "",
                absen.siswa?.nis || "",
                getKelasInfo(absen.siswa),
                formatTime(absen.jam_masuk),
                formatTime(absen.jam_pulang),
                absen.status,
                absen.keterangan || ""
            ]);

            const csvContent = [
                csvHeaders.join(","),
                ...csvData.map(row => row.map(field => `"${field}"`).join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `laporan-absensi-${filters.startDate}-${filters.endDate}.csv`);
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error("Error exporting CSV:", error);
        }
        
        setIsExporting(false);
    };

    // Quick filter functions
    const setQuickFilter = (days: number) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        setFilters({
            ...filters,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (time: string | null) => {
        if (!time) return "-";
        const [hours, minutes] = time.slice(0, 5).split(":");
        return `${hours}:${minutes}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "hadir":
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Hadir</Badge>;
            case "terlambat":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Terlambat</Badge>;
            case "izin":
                return <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">Izin</Badge>;
            case "sakit":
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Sakit</Badge>;
            case "alpha":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Alpha</Badge>;
            default:
                return <Badge className="bg-gray-200 text-gray-800">Unknown</Badge>;
        }
    };

    const getKelasInfo = (siswa?: Siswa) => {
        if (!siswa || (!siswa.kelas && !siswa.jurusan && !siswa.pararel)) return "-";
        return `${siswa.kelas?.nama_kelas || ""} ${siswa.jurusan?.nama_jurusan || ""} ${siswa.pararel?.nama_pararel || ""}`.trim();
    };

    const filteredList = absensiList.filter(absen =>
        absen.siswa?.nama_siswa?.toLowerCase().includes(search.toLowerCase()) ||
        absen.siswa?.nis?.toLowerCase().includes(search.toLowerCase())
    );

    const getDateRangeText = () => {
        if (filters.startDate === filters.endDate) {
            return formatDate(filters.startDate);
        }
        return `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 text-gray-800">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-600 text-white shadow-md">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Laporan Absensi
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        Periode: {getDateRangeText()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={exportToCSV}
                                disabled={isExporting || filteredList.length === 0}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                            >
                                <Download className="w-5 h-5" />
                                {isExporting ? "Mengunduh..." : "Export CSV"}
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-blue-600">{reportSummary.total}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Total</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-blue-600">{reportSummary.hadir}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Hadir</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-yellow-500">{reportSummary.terlambat}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Terlambat</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="w-6 h-6 bg-gray-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                            <div className="text-3xl font-bold text-gray-500">{reportSummary.izin}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Izin</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="w-6 h-6 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                            <div className="text-3xl font-bold text-purple-500">{reportSummary.sakit}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Sakit</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold text-red-500">{reportSummary.alpha}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Alpha</div>
                        </Card>
                    </div>

                    {/* Filter Section */}
                    <Card className="p-6 mb-6 shadow-sm border-gray-100 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-600" />
                                Filter & Pencarian
                            </h3>
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {showFilter ? "Sembunyikan" : "Tampilkan"} Filter
                            </button>
                        </div>

                        {/* Quick Filter Buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => setQuickFilter(0)}
                                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                                Hari Ini
                            </button>
                            <button
                                onClick={() => setQuickFilter(7)}
                                className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                            >
                                7 Hari Terakhir
                            </button>
                            <button
                                onClick={() => setQuickFilter(30)}
                                className="px-3 py-1.5 text-sm bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                                30 Hari Terakhir
                            </button>
                        </div>

                        <AnimatePresence>
                            {showFilter && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tanggal Mulai
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.startDate}
                                            onChange={e => setFilters({...filters, startDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tanggal Selesai
                                        </label>
                                        <input
                                            type="date"
                                            value={filters.endDate}
                                            onChange={e => setFilters({...filters, endDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kelas
                                        </label>
                                        <select
                                            value={filters.kelas}
                                            onChange={e => setFilters({...filters, kelas: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Semua Kelas</option>
                                            {kelasList.map(kelas => (
                                                <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={filters.status}
                                            onChange={e => setFilters({...filters, status: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="hadir">Hadir</option>
                                            <option value="terlambat">Terlambat</option>
                                            <option value="izin">Izin</option>
                                            <option value="sakit">Sakit</option>
                                            <option value="alpha">Alpha</option>
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama siswa atau NIS..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                        </div>
                    </Card>

                    {/* Table */}
                    <Card className="overflow-hidden shadow-md border-gray-100 rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIS</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Masuk</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pulang</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-blue-600 font-medium text-sm">
                                                Memuat laporan...
                                            </td>
                                        </tr>
                                    ) : filteredList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">
                                                Tidak ada data absensi pada periode yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((absen) => (
                                            <motion.tr
                                                key={absen.id}
                                                className="hover:bg-blue-50/50 transition-colors"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(absen.tanggal_absen)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {absen.siswa?.nama_siswa}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {absen.siswa?.nis}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {getKelasInfo(absen.siswa)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatTime(absen.jam_masuk)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatTime(absen.jam_pulang)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {getStatusBadge(absen.status)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {absen.keterangan || "-"}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Summary Footer */}
                    {filteredList.length > 0 && (
                        <Card className="mt-6 p-6 bg-blue-50 border-blue-200 rounded-xl">
                            <div className="text-center">
                                <p className="text-blue-800 font-medium">
                                    Menampilkan {filteredList.length} data absensi dari {reportSummary.total} total data
                                    pada periode {getDateRangeText()}
                                </p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}