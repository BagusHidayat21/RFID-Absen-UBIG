"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, Search, Plus, UserPlus, Wifi, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/Layout/Sidebar";

// Types
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

interface Siswa {
    id: string;
    nama_siswa: string;
    nis: string;
    rfid_uid?: string;
    kelas_id?: string;
    jurusan_id?: string;
    pararel_id?: string;
    kelas?: Kelas;
    jurusan?: Jurusan;
    pararel?: Pararel;
}

interface PendingRFID {
    id: string;
    rfid_uid: string;
    timestamp: string;
    status: string;
}

export default function AdminStudentData() {
    const [siswaList, setSiswaList] = useState<Siswa[]>([]);
    const [kelasList, setKelasList] = useState<Kelas[]>([]);
    const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
    const [pararelList, setPararelList] = useState<Pararel[]>([]);
    const [pendingRFIDList, setPendingRFIDList] = useState<PendingRFID[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRFIDModalOpen, setIsRFIDModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedRFID, setSelectedRFID] = useState<string>("");
    
    // Form states
    const [formData, setFormData] = useState({
        nama_siswa: "",
        nis: "",
        rfid_uid: "",
        kelas_id: "",
        jurusan_id: "",
        pararel_id: ""
    });

    useEffect(() => {
        fetchSiswa();
        fetchReferenceData();
        fetchPendingRFID();
        
        // Set up real-time listener for pending RFID
        const subscription = supabase
            .channel('pending_rfid_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_rfid' }, 
                (payload) => {
                    console.log('Change received!', payload);
                    fetchPendingRFID();
                })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // GET Siswa
    const fetchSiswa = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("siswa")
            .select(`
                *,
                kelas:kelas_id ( id, nama_kelas ),
                jurusan:jurusan_id ( id, nama_jurusan ),
                pararel:pararel_id ( id, nama_pararel )
            `)
            .order("nama_siswa", { ascending: true });

        if (!error && data) {
            setSiswaList(data);
        }
        setIsLoading(false);
    };

    // GET Reference Data
    const fetchReferenceData = async () => {
        const [kelasResult, jurusanResult, pararelResult] = await Promise.all([
            supabase.from("kelas").select("*").order("nama_kelas"),
            supabase.from("jurusan").select("*").order("nama_jurusan"),
            supabase.from("pararel").select("*").order("nama_pararel")
        ]);

        if (kelasResult.data) setKelasList(kelasResult.data);
        if (jurusanResult.data) setJurusanList(jurusanResult.data);
        if (pararelResult.data) setPararelList(pararelResult.data);
    };

    // GET Pending RFID
    const fetchPendingRFID = async () => {
        const { data, error } = await supabase
            .from("pending_rfid")
            .select("*")
            .eq("status", "pending")
            .order("timestamp", { ascending: false });

        if (!error && data) {
            setPendingRFIDList(data);
        }
    };

    // CREATE
    const createSiswa = async () => {
        const { error } = await supabase
            .from("siswa")
            .insert([{
                nama_siswa: formData.nama_siswa,
                nis: formData.nis,
                rfid_uid: formData.rfid_uid || null,
                kelas_id: formData.kelas_id || null,
                jurusan_id: formData.jurusan_id || null,
                pararel_id: formData.pararel_id || null
            }]);
        
        if (!error) {
            // Jika RFID dari pending, hapus dari pending list
            if (formData.rfid_uid && selectedRFID) {
                await supabase
                    .from("pending_rfid")
                    .update({ status: "used" })
                    .eq("rfid_uid", formData.rfid_uid);
            }
            
            fetchSiswa();
            fetchPendingRFID();
            resetForm();
            setIsAddModalOpen(false);
            setIsRFIDModalOpen(false);
        }
    };

    // UPDATE
    const updateSiswa = async () => {
        if (!editId) return;
        
        const { error } = await supabase
            .from("siswa")
            .update({
                nama_siswa: formData.nama_siswa,
                nis: formData.nis,
                rfid_uid: formData.rfid_uid || null,
                kelas_id: formData.kelas_id || null,
                jurusan_id: formData.jurusan_id || null,
                pararel_id: formData.pararel_id || null
            })
            .eq("id", editId);
        
        if (!error) {
            fetchSiswa();
            resetForm();
            setEditId(null);
        }
    };

    // DELETE
    const deleteSiswa = async () => {
        if (!deleteId) return;
        
        const { error } = await supabase
            .from("siswa")
            .delete()
            .eq("id", deleteId);
        
        if (!error) {
            fetchSiswa();
            setDeleteId(null);
        }
    };

    const resetForm = () => {
        setFormData({
            nama_siswa: "",
            nis: "",
            rfid_uid: "",
            kelas_id: "",
            jurusan_id: "",
            pararel_id: ""
        });
        setSelectedRFID("");
    };

    const handleEdit = (siswa: Siswa) => {
        setFormData({
            nama_siswa: siswa.nama_siswa,
            nis: siswa.nis,
            rfid_uid: siswa.rfid_uid || "",
            kelas_id: siswa.kelas_id || "",
            jurusan_id: siswa.jurusan_id || "",
            pararel_id: siswa.pararel_id || ""
        });
        setEditId(siswa.id);
    };

    const handleAddNew = () => {
        resetForm();
        setIsAddModalOpen(true);
    };

    const handleSelectPendingRFID = (rfid: PendingRFID) => {
        setFormData(prev => ({ ...prev, rfid_uid: rfid.rfid_uid }));
        setSelectedRFID(rfid.rfid_uid);
        setIsRFIDModalOpen(false);
    };

    const getKelasInfo = (siswa: Siswa) => {
        if (!siswa.kelas && !siswa.jurusan && !siswa.pararel) return "-";
        return `${siswa.kelas?.nama_kelas || ""} ${siswa.jurusan?.nama_jurusan || ""} ${siswa.pararel?.nama_pararel || ""}`.trim();
    };

    const filteredList = siswaList.filter(siswa =>
        siswa.nama_siswa?.toLowerCase().includes(search.toLowerCase()) ||
        siswa.nis?.toLowerCase().includes(search.toLowerCase())
    );

    const totalSiswa = siswaList.length;
    const siswaWithKelas = siswaList.filter(s => s.kelas_id).length;
    const siswaWithoutKelas = totalSiswa - siswaWithKelas;

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
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Data Siswa</h1>
                                {pendingRFIDList.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Wifi className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-green-600 font-medium">
                                            {pendingRFIDList.length} RFID baru menunggu registrasi
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-blue-600">{totalSiswa}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Total Siswa</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-green-600">{siswaWithKelas}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Sudah Dikelas</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-red-500">{siswaWithoutKelas}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">Belum Dikelas</div>
                        </Card>
                        <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                            <div className="text-3xl font-bold text-orange-600">{pendingRFIDList.length}</div>
                            <div className="text-sm font-medium text-gray-500 mt-1">RFID Pending</div>
                        </Card>
                    </div>

                    {/* Pending RFID Alert */}
                    {pendingRFIDList.length > 0 && (
                        <Card className="p-4 mb-6 bg-orange-50 border-orange-200">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-orange-800">RFID Baru Terdeteksi!</h3>
                                    <p className="text-sm text-orange-700">
                                        Ada {pendingRFIDList.length} RFID yang baru di-tap dan menunggu untuk diregistrasi ke siswa.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsRFIDModalOpen(true)}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm"
                                >
                                    Lihat RFID Pending
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Search & Action Section */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau NIS..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                        </div>
                        <div className="flex gap-3">
                            {pendingRFIDList.length > 0 && (
                                <button
                                    onClick={() => setIsRFIDModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
                                >
                                    <Wifi className="w-5 h-5" />
                                    RFID Pending ({pendingRFIDList.length})
                                </button>
                            )}
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Siswa
                            </button>
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
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RFID UID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kelas</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-blue-600 font-medium text-sm">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : filteredList.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                                                Tidak ada data siswa.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredList.map((siswa) => (
                                            <motion.tr
                                                key={siswa.id}
                                                className="hover:bg-blue-50/50 transition-colors"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{siswa.nama_siswa}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.nis}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{siswa.rfid_uid || "-"}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getKelasInfo(siswa)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {siswa.kelas_id ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aktif</Badge>
                                                    ) : (
                                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Belum Dikelas</Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(siswa)}
                                                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                                            aria-label="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteId(siswa.id)}
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
                        {/* Pending RFID Modal */}
                        {isRFIDModalOpen && (
                            <motion.div
                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                                    initial={{ scale: 0.9, y: 30 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 30 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Wifi className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            RFID Pending Registrasi
                                        </h3>
                                    </div>
                                    
                                    <div className="space-y-3 mb-6">
                                        {pendingRFIDList.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                Tidak ada RFID yang menunggu registrasi
                                            </div>
                                        ) : (
                                            pendingRFIDList.map((rfid) => (
                                                <div 
                                                    key={rfid.id}
                                                    className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                                                    onClick={() => handleSelectPendingRFID(rfid)}
                                                >
                                                    <div>
                                                        <div className="font-semibold text-gray-900">UID: {rfid.rfid_uid}</div>
                                                        <div className="text-sm text-gray-600">
                                                            Di-tap pada: {new Date(rfid.timestamp).toLocaleString('id-ID')}
                                                        </div>
                                                    </div>
                                                    <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm">
                                                        Pilih RFID Ini
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button
                                            onClick={() => setIsRFIDModalOpen(false)}
                                            className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Add/Edit Modal */}
                        {(isAddModalOpen || editId) && (
                            <motion.div
                                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
                                    initial={{ scale: 0.9, y: 30 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 30 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <UserPlus className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">
                                            {editId ? "Edit Siswa" : "Tambah Siswa Baru"}
                                        </h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa *</label>
                                            <input
                                                type="text"
                                                value={formData.nama_siswa}
                                                onChange={e => setFormData({...formData, nama_siswa: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Masukkan nama siswa"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">NIS *</label>
                                            <input
                                                type="text"
                                                value={formData.nis}
                                                onChange={e => setFormData({...formData, nis: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Masukkan NIS"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">RFID UID</label>
                                            <div className="flex gap-2">
                                                <input
                                                type="text"
                                                value={formData.rfid_uid}
                                                readOnly
                                                onChange={e => setFormData({...formData, rfid_uid: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
                                                placeholder="Tempelkan kartu RFID untuk mengisi"
                                            />
                                                {pendingRFIDList.length > 0 && (
                                                    <button
                                                        onClick={() => setIsRFIDModalOpen(true)}
                                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm flex items-center gap-2"
                                                    >
                                                        <Wifi className="w-4 h-4" />
                                                        Pilih RFID
                                                    </button>
                                                )}
                                            </div>
                                            {selectedRFID && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className="text-sm text-green-600 font-medium">✓ RFID dari tap terbaru</span>
                                                    <button
                                                        onClick={() => {
                                                            setFormData(prev => ({...prev, rfid_uid: ""}));
                                                            setSelectedRFID("");
                                                        }}
                                                        className="text-sm text-red-600 hover:underline"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                            <select
                                                value={formData.kelas_id}
                                                onChange={e => setFormData({...formData, kelas_id: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih Kelas</option>
                                                {kelasList.map(kelas => (
                                                    <option key={kelas.id} value={kelas.id}>{kelas.nama_kelas}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jurusan</label>
                                            <select
                                                value={formData.jurusan_id}
                                                onChange={e => setFormData({...formData, jurusan_id: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih Jurusan</option>
                                                {jurusanList.map(jurusan => (
                                                    <option key={jurusan.id} value={jurusan.id}>{jurusan.nama_jurusan}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pararel</label>
                                            <select
                                                value={formData.pararel_id}
                                                onChange={e => setFormData({...formData, pararel_id: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih Pararel</option>
                                                {pararelList.map(pararel => (
                                                    <option key={pararel.id} value={pararel.id}>{pararel.nama_pararel}</option>
                                                ))}
                                            </select>
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
                                            onClick={editId ? updateSiswa : createSiswa}
                                            disabled={!formData.nama_siswa || !formData.nis}
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
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Siswa?</h3>
                                    <p className="text-gray-600 mb-6 text-sm">
                                        Data siswa akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={() => setDeleteId(null)}
                                            className="px-6 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={deleteSiswa}
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