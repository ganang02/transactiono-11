
# POS System Application

A simple POS (Point of Sale) system with MySQL database integration and Bluetooth printer support.

## Fitur

- Real-time inventory management dengan database MySQL
- Sales dan transaction tracking
- Dashboard dengan analytics
- Cetak struk via Bluetooth Printer
- Mobile application (APK) support
- Export data ke Excel

## Setup Instructions

### Backend Setup pada cPanel:

1. Upload folder server ke hosting cPanel Anda.

2. Buat database MySQL di cPanel jika Anda belum memilikinya.

3. Buat schema database dengan mengimport `server/database_schema.sql` menggunakan phpMyAdmin di cPanel.

4. Setup environment variables untuk backend server:
   Buat atau update file server/.env dengan kredensial MySQL Anda:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_cpanel_db_username
   DB_PASSWORD=your_cpanel_db_password
   DB_NAME=your_cpanel_db_name
   ```

5. Setup backend server di cPanel:
   - Pastikan Node.js tersedia di hosting cPanel Anda
   - Gunakan akses SSH atau terminal cPanel untuk navigasi ke folder server
   - Jalankan `npm install` untuk menginstal dependencies
   - Setup Node.js app atau gunakan tool seperti PM2 untuk menjaga aplikasi tetap berjalan

### Frontend Setup untuk Mobile APK:

1. Update API URL di src/.env untuk mengarah ke domain cPanel Anda:
   ```
   VITE_API_URL=https://your-cpanel-domain.com/api
   ```

2. Build APK seperti instruksi di bawah.

### Alternatif: Menjalankan Frontend dan Backend secara Lokal:

Jika Anda ingin menguji secara lokal terlebih dahulu:

1. Set API URL ke localhost:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. Jalankan backend server secara lokal:
   ```
   cd server
   npm install
   npm start
   ```

3. Jalankan frontend secara lokal:
   ```
   npm install
   npm run dev
   ```

### Build APK untuk Android:

1. Build aplikasi web:
   ```
   npm run build
   ```

2. Tambahkan platform Android (jika belum ada):
   ```
   npx cap add android
   ```

3. Update project Android native dengan build web terbaru:
   ```
   npx cap sync android
   ```

4. Buka di Android Studio untuk build APK:
   ```
   npx cap open android
   ```

5. Di Android Studio:
   - Tunggu hingga Gradle sync selesai
   - Dari menu, pilih Build > Build Bundle(s) / APK(s) > Build APK(s)
   - APK akan dibuat di android/app/build/outputs/apk/debug/

6. Untuk menginstal langsung di perangkat yang terhubung:
   ```
   npx cap run android
   ```

## Panduan Lengkap Menggunakan Printer Bluetooth

### Persiapan Awal:

1. Pastikan printer Bluetooth Anda sudah menyala dan diisi dengan kertas struk
2. Aktifkan Bluetooth pada perangkat Android Anda
3. Jika ini pertama kali menggunakan aplikasi, berikan izin yang diminta:
   - Izin Bluetooth
   - Izin Lokasi (diperlukan untuk pemindaian Bluetooth)

### Menghubungkan Printer Bluetooth:

1. Di aplikasi POS, buka menu "Settings" dengan mengklik ikon roda gigi
2. Pilih tab "Printer" atau cari bagian "Pengaturan Printer"
3. Klik tombol "Cari printer Bluetooth"
4. Jika diminta izin Bluetooth atau Lokasi, berikan izin tersebut
5. Aplikasi akan memindai dan menampilkan daftar perangkat Bluetooth yang tersedia
6. Temukan printer Anda dalam daftar (biasanya nama berisi "Printer", "POS", atau nama merk)
7. Pilih printer Anda dengan mengkliknya
8. Setelah terhubung berhasil, Anda akan melihat notifikasi dan nama printer akan muncul sebagai "Terhubung"
9. Printer yang sudah terhubung akan disimpan untuk penggunaan berikutnya

### Mencetak Struk Transaksi:

1. Selesaikan transaksi pada halaman Kasir
2. Setelah transaksi selesai, klik tombol "Cetak Struk"
3. Jika printer sudah terhubung sebelumnya, pencetakan akan langsung dimulai
4. Jika printer belum terhubung, Anda akan diminta untuk memilih printer
5. Lihat preview struk terlebih dahulu (jika tersedia)
6. Konfirmasi pencetakan

### Troubleshooting Koneksi Bluetooth:

1. **Printer tidak terdeteksi saat pemindaian:**
   - Pastikan printer menyala dan dalam mode pairing/dapat ditemukan
   - Matikan dan nyalakan kembali printer
   - Pastikan baterai printer cukup
   - Matikan dan nyalakan kembali Bluetooth pada perangkat Anda
   - Periksa jarak antara printer dan perangkat (tidak lebih dari 10 meter)

2. **Izin ditolak atau masalah izin:**
   - Buka Pengaturan > Aplikasi > POS System > Izin
   - Pastikan izin Bluetooth dan Lokasi diaktifkan
   - Jika masih bermasalah, restart aplikasi dan perangkat

3. **Koneksi terputus saat mencetak:**
   - Periksa jarak antara printer dan perangkat
   - Periksa baterai printer
   - Coba hubungkan kembali dari menu Pengaturan Printer

4. **Printer tersambung tapi tidak mencetak:**
   - Pastikan printer memiliki kertas yang cukup
   - Periksa apakah printer dalam mode standby atau hemat daya
   - Coba restart printer dan hubungkan kembali
   - Periksa apakah ada error pada layar printer (jika ada)

5. **Printer mencetak teks yang tidak terbaca:**
   - Pastikan printer mendukung format teks yang dikirim
   - Untuk printer termal, pastikan kertas termal dipasang dengan benar

### Tips Penggunaan Printer Bluetooth:

1. **Hemat Baterai:**
   - Matikan printer saat tidak digunakan untuk jangka waktu lama
   - Gunakan adaptor listrik jika tersedia untuk penggunaan yang lama

2. **Pengaturan Printer:**
   - Beberapa printer memiliki pengaturan densitas cetak yang dapat disesuaikan
   - Atur kecepatan cetak jika printer mendukung

3. **Perawatan Printer:**
   - Bersihkan head printer secara berkala menggunakan alkohol isopropil
   - Gunakan kertas berkualitas baik untuk mencegah kerusakan pada head printer
   - Simpan printer di tempat yang kering dan bersih

## Menghubungkan APK ke Database di cPanel

Aplikasi yang diinstal akan terhubung ke database MySQL di hosting cPanel Anda melalui server API Node.js yang juga harus di-deploy di hosting cPanel. Pastikan bahwa:

1. Hosting cPanel Anda mengizinkan koneksi eksternal ke aplikasi Node.js (periksa port terbuka dan dapat diakses)
2. API_URL di aplikasi Anda mengarah ke domain cPanel dengan benar
3. Server Node.js terhubung dengan benar ke database MySQL Anda

## API Endpoints

Backend menyediakan endpoint API berikut:

- `/api/products` - Pengelolaan produk
- `/api/transactions` - Rekam dan ambil transaksi
- `/api/store` - Informasi toko
- `/api/dashboard` - Data analitik dashboard
- `/api/exports` - Export data ke Excel

## Struktur Database

Database MySQL mencakup tabel-tabel berikut:

- `products` - Inventaris produk
- `transactions` - Transaksi penjualan
- `transaction_items` - Item dalam setiap transaksi
- `store_info` - Informasi toko
- `exports` - History export data
