"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Edit, Trash2, Search, Plus, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/Layout/Sidebar";

// Types
interface Kelas {
    id: string;
    nama_kelas: string;
    created_at?: string;
}

interface KelasWithCount extends Kelas {
    siswa_count?: number;
}

export default function AdminClassData() {
    const [kelasList, setKelasList] = useState<KelasWithCount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    // Form states
    const [formData, setFormData] = useState({
        nama_kelas: ""
    });

    useEffect(() => {
        fetchKelas();
    }, []);

    // GET Kelas with student count
    const fetchKelas = async () => {
        setIsLoading(true);
        
        // Fetch kelas data
        const { data: kelasData, error: kelasError } = await supabase
            .from("kelas")
            .select("*")
            .order("nama_kelas", { ascending: true });

        if (!kelasError && kelasData) {
            // Get student count for each class
            const kelasWithCount = await Promise.all(
                kelasData.map(async (kelas) => {
                    const { count } = await supabase
                        .from("siswa")
                        .select("*", { count: "exact", head: true })
                        .eq("kelas_id", kelas.id);
                    
                    return {
                        ...kelas,
                        siswa_count: count || 0
                    };
                })
            );
            
            setKelasList(kelasWithCount);
        }
        setIsLoading(false);
    };

    // CREATE
    const createKelas = async () => {
        if (!formData.nama_kelas.trim()) return;
        
        const { error } = await supabase
            .from("kelas")
            .insert([{
                nama_kelas: formData.nama_kelas.trim()
            }]);
        
        if (!error) {
            fetchKelas();
            resetForm();
            setIsAddModalOpen(false);
        }
    };

    // UPDATE
    const updateKelas = async () => {
        if (!editId || !formData.nama_kelas.trim()) return;
        
        const { error } = await supabase
            .from("kelas")
            .update({
                nama_kelas: formData.nama_kelas.trim()
            })
            .eq("id", editId);
        
        if (!error) {
            fetchKelas();
            resetForm();
            setEditId(null);
        }
    };

    // DELETE
    const deleteKelas = async () => {
        if (!deleteId) return;
        
        // Check if there are students in this class
        const { count } = await supabase
            .from("siswa")
            .select("*", { count: "exact", head: true })
            .eq("kelas_id", deleteId);
        
        if (count && count > 0) {
            alert("Tidak dapat menghapus kelas yang masih memiliki siswa!");
            setDeleteId(null);
            return;
        }
        
        const { error } = await supabase
            .from("kelas")
            .delete()
            .eq("id", deleteId);
        
        if (!error) {
            fetchKelas();
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            nama_kelas: ""
        });
    };

    const handleEdit = (kelas: Kelas) => {
        setFormData({
            nama_kelas: kelas.nama_kelas
        });
        setEditId(kelas.id);
    };

    const handleAddNew = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const filteredList = kelasList.filter(kelas =>
        kelas.nama_kelas?.toLowerCase().includes(search.toLowerCase())
    );

    const totalKelas = kelasList.length;
    const kelasWithSiswa = kelasList.filter(k => k.siswa_count && k.siswa_count > 0).length;
    const kelasKosong = totalKelas - kelasWithSiswa;
    const totalSiswa = kelasList.reduce((sum, kelas) => sum + (kelas.siswa_count || 0), 0);

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 text-gray-800">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-600 text-white shadow-md">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Data Kelas
                            </h1>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-blue-600">{totalKelas}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Total Kelas</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-green-600">{kelasWithSiswa}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Kelas Aktif</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-red-500">{kelasKosong}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Kelas Kosong</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-purple-600">{totalSiswa}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Total Siswa</div>
                        </Card>
                    </div>

                    {/* Search & Action Section */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama kelas..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                        </div>
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Kelas
                        </button>
                    </div>

                    {/* Table */}
                    <Card className="overflow-hidden shadow-md border-gray-100 rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Kelas</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah Siswa</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-blue-600 font-medium text-sm">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">
                                                Tidak ada data kelas.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((kelas, index) => (
                                            <motion.tr
                                                key={kelas.id}
                                                className="hover:bg-blue-50/50 transition-colors"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        {kelas.nama_kelas}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg font-semibold text-blue-600">
                                                            {kelas.siswa_count || 0}
                                                        </span>
                                                        <span className="text-gray-500">siswa</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {(kelas.siswa_count || 0) > 0 ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aktif</Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Kosong</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(kelas)}
                                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                                            aria-label="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(kelas.id)}
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
                        {/* Add/Edit Modal */}
                        {(isAddModalOpen || editId) && (
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
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <BookOpen className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            {editId ? "Edit Kelas" : "Tambah Kelas Baru"}
                                        </h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nama Kelas *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nama_kelas}
                                                onChange={e => setFormData({...formData, nama_kelas: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Contoh: X, XI, XII"
                                                autoFocus
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Masukkan nama kelas seperti X, XI, XII atau 10, 11, 12
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 justify-end mt-8">
                                        <button
                                            onClick={() => {
                                                setIsAddModalOpen(false);
                                                setEditId(null);
                                                resetForm();
                                            }}
                                            className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={editId ? updateKelas : createKelas}
                                            disabled={!formData.nama_kelas.trim()}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                                        >
                                            {editId ? "Perbarui" : "Simpan"}
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
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Kelas?</h3>
                                    <p className="text-gray-600 mb-6 text-sm">
                                        Data kelas akan dihapus secara permanen. Pastikan tidak ada siswa di kelas ini.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={() => setDeleteId(null)}
                                            className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={deleteKelas}
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