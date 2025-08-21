"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, Search } from "lucide-react";

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
    return new Date(date).toLocaleDateString("id-ID");
  };
  
  const formatTime = (time: string | null) => {
    return time ? time.slice(0, 8) : "-";
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "hadir": return <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">Hadir</Badge>;
      case "terlambat": return <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors">Terlambat</Badge>;
      case "izin": return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 transition-colors">Izin</Badge>;
      case "sakit": return <Badge className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 transition-colors">Sakit</Badge>;
      case "alpha": return <Badge className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors">Alpha</Badge>;
      default: return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>;
    }
  };

  const total = absensiList.length;
  const hadir = absensiList.filter(a => a.status.toLowerCase() === "hadir").length;
  const terlambat = absensiList.filter(a => a.status.toLowerCase() === "terlambat").length;
  const izin = absensiList.filter(a => a.status.toLowerCase() === "izin").length;
  const sakit = absensiList.filter(a => a.status.toLowerCase() === "sakit").length;
  const alpha = absensiList.filter(a => a.status.toLowerCase() === "alpha").length;

  // Search filter
  const filteredList = absensiList.filter(a =>
    a.siswa?.nama_siswa?.toLowerCase().includes(search.toLowerCase())
  );

  // Edit handler
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

  // Delete handler
  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAbsensi(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-500 text-white">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">
              Rekap Absensi Siswa
            </h1>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <Card className="p-4 bg-white border border-blue-100 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{total}</div>
                <div className="text-sm text-slate-600">Total</div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-blue-100 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{hadir}</div>
                <div className="text-sm text-slate-600">Hadir</div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-amber-100 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{terlambat}</div>
                <div className="text-sm text-slate-600">Terlambat</div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-cyan-100 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">{izin}</div>
                <div className="text-sm text-slate-600">Izin</div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-rose-100 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">{sakit}</div>
                <div className="text-sm text-slate-600">Sakit</div>
              </div>
            </Card>
            <Card className="p-4 bg-white border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{alpha}</div>
                <div className="text-sm text-slate-600">Alpha</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-blue-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
            />
            <Search className="absolute left-3 top-3.5 w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden border border-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nama Siswa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">NIS</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tanggal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Masuk</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Pulang</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Keterangan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-blue-600 font-medium">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada data absensi.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((absen) => (
                    <tr key={absen.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{absen.siswa?.nama_siswa}</td>
                      <td className="px-6 py-4 text-slate-600">{absen.siswa?.nis}</td>
                      <td className="px-6 py-4 text-slate-600">{absen.siswa?.kelas?.nama_kelas}  {absen.siswa?.jurusan?.nama_jurusan} - {absen.siswa?.pararel?.nama_pararel}</td> 
                      <td className="px-6 py-4 text-slate-600 text-sm">{formatDate(absen.tanggal_absen)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatTime(absen.jam_masuk)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatTime(absen.jam_pulang)}</td>
                      <td className="px-6 py-4">{getStatusBadge(absen.status)}</td>
                      <td className="px-6 py-4 text-slate-600">{absen.keterangan || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(absen)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(absen.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Edit Modal */}
        {editId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Edit Absensi</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt.toLowerCase()}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                  <input
                    type="text"
                    value={editKeterangan}
                    onChange={e => setEditKeterangan(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jam Pulang</label>
                  <input
                    type="time"
                    value={editJamPulang || ''}
                    onChange={e => setEditJamPulang(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setEditId(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Absensi?</h3>
              <p className="text-slate-600 mb-6">Data absensi ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}