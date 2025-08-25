"use client";

import React, { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  BarChart3,
  Settings,
  Home,
  BookOpen,
  UserCheck,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client"; // your existing client helper

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  href: string;
}

/* helper: read cookie by name */
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const v = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
  return v ? decodeURIComponent(v.pop() || "") : null;
}

/* helper: delete cookie (tries multiple paths) */
function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  // expire cookie for multiple paths
  const paths = ["/", location.pathname];
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  for (const path of paths) {
    document.cookie = `${name}=; Path=${path}; Expires=${expires}; SameSite=Lax;`;
    document.cookie = `${name}=; Path=${path}; Expires=${expires}; Secure;`;
  }
}

/* helper: clear 'user' cookie + any sb-* non-HttpOnly cookies */
function clearAuthCookies() {
  if (typeof document === "undefined") return;
  const names = document.cookie.split(";").map((c) => c.trim().split("=")[0]);
  names
    .filter((n) => n === "user" || n.startsWith("sb-"))
    .forEach((n) => deleteCookie(n));
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient(); // your client factory (must work client-side)

  // get display user (from localStorage or cookie)
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);

  useEffect(() => {
    // read localStorage user (preferred)
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setDisplayName(parsed.full_name || parsed.user_metadata?.full_name || null);
        setDisplayEmail(parsed.email || null);
        return;
      }
    } catch (e) {
      // ignore parse errors
    }

    // fallback: read cookie 'user'
    const cookieUser = getCookie("user");
    if (cookieUser) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieUser));
        setDisplayName(parsed.full_name || parsed.email || null);
        setDisplayEmail(parsed.email || null);
        return;
      } catch {
        // not JSON — ignore
      }
    }

    // if no local session found, redirect to login
    // this is the client-side protection for Opsi 2
    router.replace("/login");
  }, [router]);

  const handleLogout = async () => {
    try {
      // 1) Try to sign out via supabase to clear server-side cookies (if any)
      // If your project never used Supabase Auth, this will harmlessly return.
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn("supabase.signOut() warning:", error.message || error);
        }
      } catch (e) {
        // ignore if signOut fails (e.g. not configured)
        console.warn("supabase.signOut() failed:", e);
      }

      // 2) Clear localStorage (your app session)
      localStorage.removeItem("user");

      // 3) Clear non-HttpOnly cookies that we can remove from JS (user, sb-*)
      clearAuthCookies();

      // 4) Close dropdown and replace route to login (replace prevents 'Back' to admin)
      setUserDropdownOpen(false);
      router.replace("/login");
    } catch (err) {
      console.error("Logout gagal:", err);
    }
  };

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/admin" },
    { id: "siswa", label: "Data Siswa", icon: Users, href: "/admin/siswa" },
    { id: "absensi", label: "Absensi", icon: UserCheck, href: "/admin/absensi" },
    { id: "kelas", label: "Data Kelas", icon: BookOpen, href: "/admin/kelas" },
    { id: "laporan", label: "Laporan", icon: BarChart3, href: "/admin/laporan" },
    { id: "pengaturan", label: "Pengaturan", icon: Settings, href: "/admin/pengaturan" },
  ];

  const isActiveMenu = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-blue-100 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Admin Panel</h1>
              <p className="text-sm text-slate-500">Sistem Absensi</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveMenu(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-slate-500"}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-blue-100">
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {displayName ? displayName.charAt(0).toUpperCase() : "A"}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-800">{displayName || "Administrator"}</p>
                <p className="text-xs text-slate-500">{displayEmail || "admin@sekolah.id"}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* User Dropdown */}
            {userDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-blue-100 rounded-xl shadow-lg py-2">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">Profil</span>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors">
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Menu className="w-5 h-5 text-slate-600" />
              </button>

              {/* Search Bar */}
              <div className="relative">
                <input type="text" placeholder="Cari..." className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors" />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mobile User Menu */}
              <div className="lg:hidden">
                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile Sidebar Close Button */}
      {sidebarOpen && (
        <button onClick={() => setSidebarOpen(false)} className="fixed top-4 right-4 z-50 lg:hidden p-2 bg-white rounded-lg shadow-md">
          <X className="w-5 h-5 text-slate-600" />
        </button>
      )}
    </div>
  );
}
