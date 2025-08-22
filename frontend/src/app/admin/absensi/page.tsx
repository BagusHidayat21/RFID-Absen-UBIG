"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/Layout/Sidebar";

// Types
interface Siswa {
    id: string;
    nama_siswa: string;
    nis: string;
    rfid_uid?: string;
    kelas_id?: string;
    jurusan_id?: string;
    pararel_id?: string;
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

const STATUS_OPTIONS = ["Hadir", "Terlambat", "Izin", "Sakit", "Alpha"];

export default function AdminAttendanceTable() {
    const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editStatus, setEditStatus] = useState("");
    const [editKeterangan, setEditKeterangan] = useState("");
    const [editJamPulang, setEditJamPulang] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchAbsensi();
    }, []);

    // GET
    const fetchAbsensi = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("absensi")
            .select(`
                *,
                siswa:siswa_id (
                    *,
                    kelas:kelas_id ( id, nama_kelas ),
                    jurusan:jurusan_id ( id, nama_jurusan ),
                    pararel:pararel_id ( id, nama_pararel )
                )
            `)
            .order("tanggal_absen", { ascending: false })
            .order("jam_masuk", { ascending: false });

        if (!error && data) {
            const mapped = data.map((absen: any) => ({
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
            setAbsensiList(mapped);
        }
        setIsLoading(false);
    };

    // UPDATE
    const updateAbsensi = async (id: string, updateData: { status?: string; keterangan?: string; jam_pulang?: string | null }) => {
        const { error } = await supabase
            .from("absensi")
            .update(updateData)
            .eq("id", id);
        if (!error) fetchAbsensi();
    };

    // DELETE
    const deleteAbsensi = async (id: string) => {
        const { error } = await supabase
            .from("absensi")
            .delete()
            .eq("id", id);
        if (!error) fetchAbsensi();
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

    const total = absensiList.length;
    const hadir = absensiList.filter(a => a.status.toLowerCase() === "hadir").length;
    const terlambat = absensiList.filter(a => a.status.toLowerCase() === "terlambat").length;
    const izin = absensiList.filter(a => a.status.toLowerCase() === "izin").length;
    const sakit = absensiList.filter(a => a.status.toLowerCase() === "sakit").length;
    const alpha = absensiList.filter(a => a.status.toLowerCase() === "alpha").length;

    const filteredList = absensiList.filter(a =>
        a.siswa?.nama_siswa?.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (absen: Absensi) => {
        setEditId(absen.id);
        setEditStatus(absen.status);
        setEditKeterangan(absen.keterangan || "");
        setEditJamPulang(absen.jam_pulang);
    };

    const handleEditSave = async () => {
        if (!editId) return;
        await updateAbsensi(editId, {
            status: editStatus,
            keterangan: editKeterangan,
            jam_pulang: editJamPulang
        });
        setEditId(null);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await deleteAbsensi(deleteId);
        setDeleteId(null);
    };

    return (
        <AdminLayout>
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-600 text-white shadow-md">
                            <User className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Rekap Absensi Siswa
                        </h1>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
                    <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600">{total}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Total</div>
                    </Card>
                    <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600">{hadir}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Hadir</div>
                    </Card>
                    <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                        <div className="text-3xl font-bold text-yellow-500">{terlambat}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Terlambat</div>
                    </Card>
                    <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                        <div className="text-3xl font-bold text-gray-500">{izin}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Izin</div>
                    </Card>
                    <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                        <div className="text-3xl font-bold text-purple-500">{sakit}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Sakit</div>
                    </Card>
                    <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                        <div className="text-3xl font-bold text-red-500">{alpha}</div>
                        <div className="text-sm font-medium text-gray-500 mt-1">Alpha</div>
                    </Card>
                </div>

                {/* Search & Action Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden shadow-md border-gray-100 rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Siswa</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIS</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Masuk</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pulang</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Keterangan</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-blue-600 font-medium text-sm">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : filteredList.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm">
                                            Tidak ada data absensi.
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{absen.siswa?.nama_siswa}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{absen.siswa?.nis}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {absen.siswa?.kelas?.nama_kelas} {absen.siswa?.jurusan?.nama_jurusan} - {absen.siswa?.pararel?.nama_pararel}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(absen.tanggal_absen)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(absen.jam_masuk)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(absen.jam_pulang)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(absen.status)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{absen.keterangan || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(absen)}
                                                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                                        aria-label="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(absen.id)}
                                                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors"
                                                        aria-label="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <AnimatePresence>
                    {/* Edit Modal */}
                    {editId && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
                                initial={{ scale: 0.9, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 30 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit Absensi</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            value={editStatus}
                                            onChange={e => setEditStatus(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                        <input
                                            type="text"
                                            value={editKeterangan}
                                            onChange={e => setEditKeterangan(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Tambahkan keterangan..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jam Pulang</label>
                                        <input
                                            type="time"
                                            value={editJamPulang || ''}
                                            onChange={e => setEditJamPulang(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end mt-8">
                                    <button
                                        onClick={() => setEditId(null)}
                                        className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleEditSave}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Delete Modal */}
                    {deleteId && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm text-center"
                                initial={{ scale: 0.9, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 30 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Absensi?</h3>
                                <p className="text-gray-600 mb-6 text-sm">Anda yakin ingin menghapus data ini secara permanen?</p>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
        </AdminLayout>
    );
}