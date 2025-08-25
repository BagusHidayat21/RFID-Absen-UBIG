import network
import urequests
import ujson
import ntptime
import utime
import time
from machine import Pin, SPI
from mfrc522 import MFRC522

# --- PENGATURAN JARINGAN & SUPABASE ---
WIFI_SSID = "keren"
WIFI_PASSWORD = "hello world"

SUPABASE_URL = "https://irbeulpuchvaxuvdsvyc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyYmV1bHB1Y2h2YXh1dmRzdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNDc5MzksImV4cCI6MjA3MDYyMzkzOX0.UrAV2PM7T2vl9IzyFrAfRwwVHFoyxswp-x5pax7MsqE"
TABLE_SISWA = "siswa"
TABLE_ABSENSI = "absensi"
TABLE_RFID_SCANS = "rfid_scans" # <-- [BARU] Tabel untuk realtime scan

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

TIME_OFFSET = 7 * 3600 # Offset untuk WIB (UTC+7)

# === INISIALISASI RFID-RC522 ===
try:
    rdr = MFRC522(gpioRst=0, gpioCs=2)
    print("Inisialisasi RFID Reader berhasil.")
except Exception as e:
    print(f"Gagal inisialisasi RFID Reader: {e}")
    while True: pass

# === INISIALISASI BUZZER ===
buzzer_pin = Pin(16, Pin.OUT)
buzzer_pin.value(0)

def beep(duration_ms=100):
    buzzer_pin.value(1)
    time.sleep_ms(duration_ms)
    buzzer_pin.value(0)

# === KONEKSI WIFI ===
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Menghubungkan ke WiFi...")
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        while not wlan.isconnected():
            time.sleep(1)
    print("Terhubung ke WiFi:", wlan.ifconfig())

# === SYNC WAKTU (NTP) ===
def sync_time():
    try:
        ntptime.host = "id.pool.ntp.org"
        print("Sinkronisasi waktu dari NTP...")
        ntptime.settime()
        print("Sinkronisasi waktu berhasil.")
    except Exception as e:
        print("Gagal sync waktu:", e)

def get_waktu_wib():
    y, m, d, hh, mm, ss, _, _ = utime.localtime(utime.time() + TIME_OFFSET)
    return y, m, d, hh, mm, ss

def format_date(y, m, d):
    return "%04d-%02d-%02d" % (y, m, d)

def format_time(hh, mm, ss):
    return "%02d:%02d:%02d" % (hh, mm, ss)

# --- Aturan Absensi ---
def tentukan_status_masuk(jam, menit, detik):
    batas_hadir_akhir = 7 * 3600 + 15 * 60  # 07:15:00
    if (jam * 3600 + menit * 60 + detik) <= batas_hadir_akhir:
        return "hadir"
    return "terlambat"

def di_jam_pulang(jam, menit, detik):
    batas_pulang = 13 * 3600 + 0 * 60 # 13:00:00
    return (jam * 3600 + menit * 60 + detik) >= batas_pulang

# === [BARU] FUNGSI UNTUK MENGIRIM SCAN UID KE FRONTEND ===
def kirim_scan_rfid(uid):
    """Mengirim UID yang baru di-scan ke tabel rfid_scans untuk ditangkap oleh frontend."""
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_RFID_SCANS}"
    payload = {"uid": uid}
    try:
        resp = urequests.post(url, data=ujson.dumps(payload), headers=HEADERS)
        if resp.status_code // 100 == 2:
            print(f"[OK] Scan UID {uid} terkirim ke frontend.")
        else:
            # Jangan tampilkan error jika tabel belum ada, agar tidak mengganggu
            if resp.status_code != 404:
                 print("ERROR kirim_scan_rfid:", resp.status_code, resp.text)
        resp.close()
    except Exception as e:
        print("Error kirim_scan_rfid:", e)

# === CARI SISWA DI SUPABASE ===
def cari_siswa(uid):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_SISWA}?rfid_uid=eq.{uid}"
    try:
        r = urequests.get(url, headers=HEADERS)
        if r.status_code // 100 != 2:
            print("ERROR cari_siswa:", r.status_code, r.text)
            r.close()
            return None
        data = r.json()
        r.close()
        if data and len(data) > 0:
            siswa = data[0]
            print(f"[INFO] Ditemukan siswa: {siswa.get('nama_siswa')} (ID: {siswa.get('id')})")
            return siswa
        print("[WARN] UID tidak ditemukan di tabel siswa")
        return None
    except Exception as e:
        print("Error cari_siswa:", e)
        return None

# === HELPERS ABSENSI ===
def get_record_absen_hari_ini(siswa_id, tanggal_absen):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_ABSENSI}?siswa_id=eq.{siswa_id}&tanggal_absen=eq.{tanggal_absen}"
    try:
        r = urequests.get(url, headers=HEADERS)
        if r.status_code // 100 != 2:
            print("ERROR cek absensi:", r.status_code, r.text)
            r.close()
            return None
        data = r.json()
        r.close()
        if data and len(data) > 0:
            return data[0]
        return None
    except Exception as e:
        print("Error get_record_absen_hari_ini:", e)
        return None

# === KIRIM / UPDATE ABSENSI KE SUPABASE ===
def kirim_absensi(siswa):
    tahun, bulan, hari, jam, menit, detik = get_waktu_wib()
    tanggal_absen = format_date(tahun, bulan, hari)
    jam_sekarang = format_time(jam, menit, detik)
    record = get_record_absen_hari_ini(siswa["id"], tanggal_absen)
    if not record:
        status_masuk = tentukan_status_masuk(jam, menit, detik)
        payload = {"siswa_id": siswa["id"], "tanggal_absen": tanggal_absen, "jam_masuk": jam_sekarang, "status": status_masuk}
        try:
            url = f"{SUPABASE_URL}/rest/v1/{TABLE_ABSENSI}"
            resp = urequests.post(url, data=ujson.dumps(payload), headers=HEADERS)
            if resp.status_code // 100 == 2: print(f"[OK] Absen masuk {siswa['nama_siswa']} jam {jam_sekarang} ({status_masuk})")
            else: print("ERROR POST absensi:", resp.status_code, resp.text)
            resp.close()
        except Exception as e: print("Error POST absensi:", e)
    elif record and di_jam_pulang(jam, menit, detik) and not record.get("jam_pulang"):
        try:
            url = f"{SUPABASE_URL}/rest/v1/{TABLE_ABSENSI}?id=eq.{record['id']}"
            payload = {"jam_pulang": jam_sekarang}
            resp = urequests.patch(url, data=ujson.dumps(payload), headers=HEADERS)
            if resp.status_code // 100 == 2: print(f"[OK] Absen pulang {siswa['nama_siswa']} jam {jam_sekarang}")
            else: print("ERROR PATCH absensi:", resp.status_code, resp.text)
            resp.close()
        except Exception as e: print("Error PATCH absensi:", e)
    else:
        if record.get("jam_pulang"): print(f"[INFO] {siswa['nama_siswa']} sudah absen masuk dan pulang hari ini.")
        else: print(f"[INFO] {siswa['nama_siswa']} sudah absen masuk hari ini. Belum waktunya pulang.")

# === PROGRAM UTAMA (LOOP) ===
def main_loop():
    connect_wifi()
    sync_time()
    
    print("\n======================================")
    print("Sistem Absensi Siap. Tempelkan kartu RFID Anda...")
    print("======================================")
    beep(200)

    while True:
        (stat, tag_type) = rdr.request(rdr.REQIDL)

        if stat == rdr.OK:
            (stat, raw_uid) = rdr.anticoll()

            if stat == rdr.OK:
                beep()
                
                uid_rfid = "%02X%02X%02X%02X" % (raw_uid[0], raw_uid[1], raw_uid[2], raw_uid[3])
                print(f"\nKartu terdeteksi! UID: {uid_rfid}")
                
                # [BARU] Kirim UID ke frontend via tabel rfid_scans
                kirim_scan_rfid(uid_rfid)
                
                # Mencari siswa berdasarkan UID yang terdeteksi
                siswa = cari_siswa(uid_rfid)
                if siswa:
                    kirim_absensi(siswa)
                else:
                    print("UID tidak terdaftar, absensi gagal.")
                
                time.sleep(3)
                print("\nTempelkan kartu RFID berikutnya...")
        
        time.sleep_ms(100)

# --- Jalankan program ---
main_loop()
