"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Settings, 
    User, 
    Lock, 
    Clock, 
    School, 
    Database, 
    Bell, 
    Shield,
    Save,
    RefreshCw,
    Eye,
    EyeOff,
    Info,
    CheckCircle,
    AlertTriangle,
    Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/Layout/Sidebar";

// Types
interface SystemSettings {
    school_name: string;
    academic_year: string;
    semester: string;
    attendance_start_time: string;
    attendance_end_time: string;
    late_threshold_minutes: number;
    auto_absent_enabled: boolean;
    notification_enabled: boolean;
}

interface AdminProfile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    last_login?: string;
}

interface DatabaseStats {
    total_students: number;
    total_classes: number;
    total_attendance_records: number;
    database_size: string;
}

export default function AdminSettings() {
    const [activeTab, setActiveTab] = useState("system");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    
    // System Settings
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        school_name: "SMK Negeri 1 Bondowoso    ",
        academic_year: "2024/2025",
        semester: "Genap",
        attendance_start_time: "06:30",
        attendance_end_time: "15:00",
        late_threshold_minutes: 15,
        auto_absent_enabled: true,
        notification_enabled: true
    });

    // Admin Profile
    const [adminProfile, setAdminProfile] = useState<AdminProfile>({
        id: "",
        full_name: "Administrator",
        email: "admin@smkn1surabaya.sch.id",
        role: "Super Admin",
        last_login: new Date().toISOString()
    });

    // Password Change
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Database Stats
    const [databaseStats, setDatabaseStats] = useState<DatabaseStats>({
        total_students: 0,
        total_classes: 0,
        total_attendance_records: 0,
        database_size: "0 MB"
    });

    useEffect(() => {
        fetchDatabaseStats();
        setIsLoading(false);
    }, []);

    // Fetch Database Statistics
    const fetchDatabaseStats = async () => {
        try {
            const [studentsResult, classesResult, attendanceResult] = await Promise.all([
                supabase.from("siswa").select("*", { count: "exact", head: true }),
                supabase.from("kelas").select("*", { count: "exact", head: true }),
                supabase.from("absensi").select("*", { count: "exact", head: true })
            ]);

            setDatabaseStats({
                total_students: studentsResult.count || 0,
                total_classes: classesResult.count || 0,
                total_attendance_records: attendanceResult.count || 0,
                database_size: "2.5 MB" // This would need to be calculated from actual database
            });
        } catch (error) {
            console.error("Error fetching database stats:", error);
        }
    };

    // Save System Settings
    const saveSystemSettings = async () => {
        setIsSaving(true);
        
        // Simulate API call - replace with actual implementation
        setTimeout(() => {
            setSaveMessage("Pengaturan sistem berhasil disimpan!");
            setIsSaving(false);
            setTimeout(() => setSaveMessage(""), 3000);
        }, 1000);
    };

    // Save Admin Profile
    const saveAdminProfile = async () => {
        setIsSaving(true);
        
        // Simulate API call - replace with actual implementation
        setTimeout(() => {
            setSaveMessage("Profil admin berhasil diperbarui!");
            setIsSaving(false);
            setTimeout(() => setSaveMessage(""), 3000);
        }, 1000);
    };

    // Change Password
    const changePassword = async () => {
        if (passwordData.new_password !== passwordData.confirm_password) {
            setSaveMessage("Password baru tidak cocok!");
            setTimeout(() => setSaveMessage(""), 3000);
            return;
        }

        if (passwordData.new_password.length < 8) {
            setSaveMessage("Password harus minimal 8 karakter!");
            setTimeout(() => setSaveMessage(""), 3000);
            return;
        }

        setIsSaving(true);
        
        // Simulate API call - replace with actual implementation
        setTimeout(() => {
            setSaveMessage("Password berhasil diubah!");
            setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
            setIsSaving(false);
            setTimeout(() => setSaveMessage(""), 3000);
        }, 1000);
    };

    // Reset Database (Dangerous operation)
    const resetDatabase = async () => {
        const confirmation = window.confirm(
            "PERINGATAN! Tindakan ini akan menghapus SEMUA data absensi. Apakah Anda yakin?"
        );
        
        if (!confirmation) return;

        const doubleConfirmation = window.confirm(
            "Konfirmasi sekali lagi: Semua data absensi akan HILANG PERMANEN!"
        );
        
        if (!doubleConfirmation) return;

        setIsSaving(true);
        
        // Simulate API call - replace with actual dangerous operation
        setTimeout(() => {
            setSaveMessage("Database absensi berhasil direset!");
            fetchDatabaseStats(); // Refresh stats
            setIsSaving(false);
            setTimeout(() => setSaveMessage(""), 3000);
        }, 2000);
    };

    const tabs = [
        { id: "system", label: "Sistem", icon: Settings },
        { id: "profile", label: "Profil", icon: User },
        { id: "security", label: "Keamanan", icon: Shield },
        { id: "database", label: "Database", icon: Database }
    ];

    const formatLastLogin = (dateString?: string) => {
        if (!dateString) return "Belum pernah login";
        return new Date(dateString).toLocaleString("id-ID", {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 text-gray-800">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-blue-600 text-white shadow-md">
                                <Settings className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Pengaturan Sistem
                            </h1>
                        </div>
                    </div>

                    {/* Save Message */}
                    <AnimatePresence>
                        {saveMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-6"
                            >
                                <Card className="p-4 bg-green-50 border-green-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="text-green-800 font-medium">{saveMessage}</span>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
                        {tabs.map(tab => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-gray-600 hover:text-blue-600"
                                    }`}
                                >
                                    <IconComponent className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* System Settings Tab */}
                    {activeTab === "system" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <Card className="p-6 shadow-sm border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <School className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Informasi Sekolah</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Sekolah
                                        </label>
                                        <input
                                            type="text"
                                            value={systemSettings.school_name}
                                            onChange={e => setSystemSettings({...systemSettings, school_name: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tahun Akademik
                                        </label>
                                        <input
                                            type="text"
                                            value={systemSettings.academic_year}
                                            onChange={e => setSystemSettings({...systemSettings, academic_year: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Semester
                                        </label>
                                        <select
                                            value={systemSettings.semester}
                                            onChange={e => setSystemSettings({...systemSettings, semester: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Ganjil">Semester Ganjil</option>
                                            <option value="Genap">Semester Genap</option>
                                        </select>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 shadow-sm border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Pengaturan Absensi</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Jam Mulai Absensi
                                        </label>
                                        <input
                                            type="time"
                                            value={systemSettings.attendance_start_time}
                                            onChange={e => setSystemSettings({...systemSettings, attendance_start_time: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Jam Selesai Absensi
                                        </label>
                                        <input
                                            type="time"
                                            value={systemSettings.attendance_end_time}
                                            onChange={e => setSystemSettings({...systemSettings, attendance_end_time: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Batas Terlambat (menit)
                                        </label>
                                        <input
                                            type="number"
                                            value={systemSettings.late_threshold_minutes}
                                            onChange={e => setSystemSettings({...systemSettings, late_threshold_minutes: parseInt(e.target.value)})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            max="60"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Auto Absent</h3>
                                            <p className="text-sm text-gray-600">Otomatis tandai alpha jika tidak absen</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={systemSettings.auto_absent_enabled}
                                                onChange={e => setSystemSettings({...systemSettings, auto_absent_enabled: e.target.checked})}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Notifikasi</h3>
                                            <p className="text-sm text-gray-600">Kirim notifikasi untuk event penting</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={systemSettings.notification_enabled}
                                                onChange={e => setSystemSettings({...systemSettings, notification_enabled: e.target.checked})}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-end">
                                <button
                                    onClick={saveSystemSettings}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                                >
                                    {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <Card className="p-6 shadow-sm border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Profil Administrator</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            value={adminProfile.full_name}
                                            onChange={e => setAdminProfile({...adminProfile, full_name: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={adminProfile.email}
                                            onChange={e => setAdminProfile({...adminProfile, email: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role
                                        </label>
                                        <input
                                            type="text"
                                            value={adminProfile.role}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Terakhir Login
                                        </label>
                                        <input
                                            type="text"
                                            value={formatLastLogin(adminProfile.last_login)}
                                            disabled
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <div className="flex justify-end">
                                <button
                                    onClick={saveAdminProfile}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                                >
                                    {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isSaving ? "Menyimpan..." : "Simpan Profil"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Security Tab */}
                    {activeTab === "security" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <Card className="p-6 shadow-sm border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Lock className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Ubah Password</h2>
                                </div>
                                
                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password Saat Ini
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={passwordData.current_password}
                                                onChange={e => setPasswordData({...passwordData, current_password: e.target.value})}
                                                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={e => setPasswordData({...passwordData, new_password: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Konfirmasi Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordData.confirm_password}
                                            onChange={e => setPasswordData({...passwordData, confirm_password: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={changePassword}
                                        disabled={isSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm"
                                    >
                                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                        {isSaving ? "Mengubah..." : "Ubah Password"}
                                    </button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Database Tab */}
                    {activeTab === "database" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                                    <div className="text-3xl font-bold text-blue-600">{databaseStats.total_students}</div>
                                    <div className="text-sm font-medium text-gray-500 mt-1">Total Siswa</div>
                                </Card>
                                <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                                    <div className="text-3xl font-bold text-green-600">{databaseStats.total_classes}</div>
                                    <div className="text-sm font-medium text-gray-500 mt-1">Total Kelas</div>
                                </Card>
                                <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                                    <div className="text-3xl font-bold text-purple-600">{databaseStats.total_attendance_records}</div>
                                    <div className="text-sm font-medium text-gray-500 mt-1">Data Absensi</div>
                                </Card>
                                <Card className="p-5 text-center bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 rounded-xl">
                                    <div className="text-3xl font-bold text-orange-600">{databaseStats.database_size}</div>
                                    <div className="text-sm font-medium text-gray-500 mt-1">Ukuran DB</div>
                                </Card>
                            </div>

                            <Card className="p-6 shadow-sm border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Database className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Manajemen Database</h2>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                            <div>
                                                <h3 className="font-medium text-yellow-800">Reset Database Absensi</h3>
                                                <p className="text-sm text-yellow-700 mt-1">
                                                    Tindakan ini akan menghapus SEMUA data absensi secara permanen. 
                                                    Data siswa dan kelas tidak akan terpengaruh.
                                                </p>
                                                <button
                                                    onClick={resetDatabase}
                                                    disabled={isSaving}
                                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                                                >
                                                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                                    {isSaving ? "Mereset..." : "Reset Data Absensi"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                            <div>
                                                <h3 className="font-medium text-blue-800">Backup Database</h3>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    Buat backup semua data sistem untuk keamanan data.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setSaveMessage("Fitur backup akan segera tersedia!");
                                                        setTimeout(() => setSaveMessage(""), 3000);
                                                    }}
                                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Backup Database
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <RefreshCw className="w-5 h-5 text-green-600 mt-0.5" />
                                            <div>
                                                <h3 className="font-medium text-green-800">Refresh Statistik</h3>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Perbarui statistik database untuk mendapatkan data terkini.
                                                </p>
                                                <button
                                                    onClick={fetchDatabaseStats}
                                                    disabled={isSaving}
                                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                                                >
                                                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                    {isSaving ? "Memperbarui..." : "Refresh Statistik"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 shadow-sm border-gray-100 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-xl font-semibold text-gray-900">Sistem Informasi</h2>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600">Versi Aplikasi</span>
                                        <Badge className="bg-blue-100 text-blue-800">v1.0.0</Badge>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600">Database Status</span>
                                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600">Server Status</span>
                                        <Badge className="bg-green-100 text-green-800">Running</Badge>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600">Last Update</span>
                                        <span className="text-gray-700">
                                            {new Date().toLocaleString("id-ID", {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600">Environment</span>
                                        <Badge className="bg-yellow-100 text-yellow-800">Production</Badge>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
