# Nande Nihon UI Package Documentation

Dokumentasi ini berisi instruksi penggunaan komponen, ikon, logo, dan sistem tema yang ada di dalam package `@repo/ui`. Package ini didesain untuk digunakan di seluruh ekosistem project Nande Nihon (Landing, App, Dashboard, dll).

---

## Cara Penggunaan Umum

Untuk menggunakan komponen dari package ini, pastikan package sudah terpasang di `package.json` project Anda:

```json
"dependencies": {
  "@repo/ui": "*"
}
```

Import komponen yang dibutuhkan langsung dari `@repo/ui`:

```tsx
import { Chips, CategoryTag, FormInput } from "@repo/ui";
```

---

## 1. Themes & Design Tokens (`/src/themes`)

Nande Nihon menggunakan **Tailwind CSS v4** dengan sistem `@theme`. Semua token didefinisikan di `tokens.css` dan secara otomatis terhubung ke utility classes Tailwind.

### A. Warna (Colors)
Gunakan prefix `bg-`, `text-`, atau `border-` diikuti dengan nama token.

| Palette | Token Utama | Utility Class Contoh |
| --- | --- | --- |
| **Primary** | `primary-base` | `text-primary-base`, `bg-primary-10` |
| **Secondary** | `secondary-base` | `text-secondary-base`, `bg-secondary-20` |
| **Tertiary** | `tertiary-base` | `bg-tertiary-base` |
| **Neutral** | `neutral-0` s/d `90` | `text-neutral-70`, `bg-neutral-10` |
| **Success** | `success-base` | `text-success-base`, `bg-success-10` |
| **Error** | `error-base` | `text-error-base`, `bg-error-10` |
| **Warning** | `warning-base` | `text-warning-base`, `bg-warning-10` |
| **Absolute** | `absolute-white`, `absolute-black` | `text-absolute-white` |

**Contoh Kode:**
```tsx
<div className="bg-primary-10 border border-primary-base text-primary-base p-4 rounded-lg">
  Konten dengan warna tema
</div>
```

### B. Ukuran Font (Font Sizes)
Ukuran font sudah termasuk konfigurasi `line-height` otomatis.

- `text-xs-micro` (10px)
- `text-xs` (12px)
- `text-sm` (14px)
- `text-base` (16px)
- `text-lg` (20px)
- `text-xl` (24px)
- `text-2xl` (32px)
- `text-3xl` (48px)

### C. Ketebalan Font (Font Weights)
- `font-regular` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)

**Contoh Kode:**
```tsx
<h1 className="text-2xl font-bold text-neutral-80">Judul Artikel</h1>
<p className="text-sm font-regular text-neutral-60">Deskripsi singkat...</p>
```

---

## 2. Components (`/src/components`)

Gunakan komponen ini untuk membangun UI yang konsisten tanpa perlu menulis styling dari nol.

### Form Components
Komponen standar untuk input data yang sudah terintegrasi dengan styling tema.

- **`FormInput`**: Input teks dengan dukungan label, ikon kiri/kanan, helper text, dan error state. Dilengkapi dengan dua varian visual.
  - **Props**:
    - `label`: Judul field (Wajib).
    - `variant`: `subtle` (default) | `primary`.
    - `leftIcon`: Menampilkan ikon di sisi kiri input.
    - `rightIcon`: Menampilkan ikon di sisi kanan input (misal: toggle password).
    - `helperText`: Informasi tambahan di bawah field.
    - `error`: Pesan kesalahan (otomatis mengubah warna field menjadi merah).
  - **Contoh**:
    ```tsx
    <FormInput 
      label="Kata Sandi" 
      type="password"
      variant="primary"
      leftIcon={<LockIcon />} 
      rightIcon={<EyeIcon />}
      helperText="Minimal 8 karakter"
    />
    ```
- **`FormSelect`**: Dropdown untuk pilihan tunggal.
- **`FormTextarea`**: Input teks untuk konten yang lebih panjang.
- **`FormFile`**: Komponen khusus untuk memilih dan mengupload file/gambar.
- **`Checkbox`**: Checkbox kustom dengan dukungan label dan states.
  - **Props**: `label`, `disabled`, `checked`, `onChange`.
  - **Contoh**:
    ```tsx
    <Checkbox  
      label="Saya setuju dengan Syarat & Ketentuan" 
      checked={isChecked}
      onChange={(e) => setIsChecked(e.target.checked)}
    />
    ```
- **`Button`**: Tombol aksi utama dengan berbagai varian dan ukuran.
  - **Props**:
    - `variant`: `primary` | `secondary` | `tertiary`
    - `size`: `large` | `medium` | `small` 
    - `leftIcon`: Elemen React untuk ikon di sisi kiri.
    - `rightIcon`: Elemen React untuk ikon di sisi kanan.
  - **Contoh**:
    ```tsx
    <Button variant="primary" size="large" leftIcon={<PlusIcon />}>
      Tambah Data
    </Button>
    ```

### UI Components
- **`Chips`**: Digunakan untuk filter atau seleksi kategori (contohnya di halaman List Artikel).
  - **Props**: 
    - `label`: Teks yang muncul di dalam chip.
    - `isSelected`: Mengubah style menjadi state terpilih (bg-primary-50).
    - `size`: `small` (py-2) atau `large` (py-3).
- **`CategoryTag`**: Tag kecil untuk indikator kategori artikel dengan skema warna otomatis berdasarkan nama kategorinya.
  - **Props**: `category` ("Budaya", "Travel", "Makanan", dll).
- **`Divider`**: Garis pemisah horizontal yang bersih untuk memisahkan section konten.
- **`Menu`**: Komponen navigasi untuk sidebar atau menu lainnya.
  - **Props**:
    - `text`: Teks menu (Wajib).
    - `icon`: Ikon menu.
    - `isSelected`: State aktif (menambahkan dot divider dan mengubah warna background).
  - **Contoh**:
    ```tsx
    <Menu 
      text="Dashboard" 
      icon={<HomeIcon />} 
      isSelected={true} 
    />
    ```
- **`MenuOption`**: Komponen menu dengan dropdown (collapsible) untuk sub-menu.
  - **Props**:
    - `text`: Judul menu utama.
    - `icon`: Ikon menu utama.
    - `options`: Array object `{ text, onClick }` untuk sub-menu.
- **`CardNews`**: Kartu artikel standar dengan gambar, kategori, dan meta info.
  - **Props**: `slug`, `title`, `image`, `category`, `author`, `date`.
  - **Contoh**:
    ```tsx
    <MenuOption 
      text="Settings" 
      icon={<SettingIcon />} 
      options={[
        { text: "Profile", onClick: () => console.log("Profile") },
        { text: "Security", onClick: () => console.log("Security") }
      ]} 
    />
    ```
- **`SidebarMenu`**: Wrapper navigasi lengkap yang menggabungkan `Menu` dan `MenuOption`.
  - **Props**: 
    - `items` (Array of objects: `{ type: 'menu' | 'option', text, icon, ... }`)
    - `header`: Slot untuk logo di atas sidebar.
    - `footer`: Slot untuk konten bawah sidebar (misal: logout).
  - **Contoh**:
    ```tsx
    <SidebarMenu
      header={<Logo />}
      items={[
        { type: "menu", text: "Dashboard", icon: <HomeIcon /> },
        { 
          type: "option", 
          text: "Settings", 
          icon: <CogIcon />, 
          options: [{ text: "Profile" }] 
        }
      ]} 
    />
    ```
- **`StepIndicator`**: Menampilkan progres langkah dalam sebuah alur (misal: pendaftaran).
- **`Stepper`**: Komponen paginasi halaman angka dengan tombol Previous/Next.
  - **Props**: `currentPage`, `totalPages`, `onPageChange`.
  - **Contoh**:
    ```tsx
    <Stepper
      currentPage={page}
      totalPages={10}
      onPageChange={(p) => setPage(p)}
    />
    ```
- **`Testimoni`**: Kartu testimoni dengan foto profil overlapping.
  - **Props**: `content`, `name`, `age`, `photo`.
  - **Contoh**:
    ```tsx
    <Testimoni
      content="Belajar di Nande Nihon asik banget, materinya mudah dipahami!"
      name="Aulia"
      age={22}
      photo="/images/profile.jpg"
    />
    ```

- **`DropdownMenu`**: Menu dropdown interaktif yang muncul saat elemen diklik.
  - **Props**: `trigger` (ReactNode), `items` (Array of objects), `width`, `placeholder`.
  - **Contoh**:
    ```tsx
    <DropdownMenu
      placeholder="Pilih Pengalaman"
      items={[
        { label: "Belum Pernah", onClick: () => console.log("A") },
        { label: "Belajar Otodidak", onClick: () => console.log("B") },
      ]}
    />
    ```
- **`ClassCard`**: Kartu inventaris kelas dengan harga, deskripsi, dan aksi.
  - **Props**: `title`, `description`, `price`, `duration`, `image`, `onStart`, `onDetail`.
  - **Contoh**:
    ```tsx
    <ClassCard
      title="Hiragana & Katakana"
      description="Untuk pemula yang benar-benar baru."
      price="Rp20.000"
      duration="Setiap Weekend"
      onStart={() => {}}
      onDetail={() => {}}
    />
    ```
- **`ExperienceCard`**: Kartu untuk menampilkan fitur atau keunggulan dengan ikon 3D di bagian atas.
  - **Props**: `title`, `description`, `icon`.
  - **Contoh**:
    ```tsx
    <ExperienceCard
      title="Kelas Online Interaktif"
      description="4x pertemuan Zoom. Setiap sesi terekam dan bisa dipelajari ulang."
      icon={<Interactive3DIcon />}
    />
    ```

---

## 3. Iconography System (`/src/icons`)

Kami menyediakan sistem ikon yang terstandarisasi untuk kebutuhan UI yang berbeda.

### Flat Icons (SVG)
Ikon berbasis SVG yang ringan. Anda dapat mengubah warnanya menggunakan utility class `text-{color}` dari Tailwind.
- **Contoh Penggunaan**:
  ```tsx
  import { WaIcon, SearchIcon, CalendarIcon } from "@repo/ui";
  
  <WaIcon className="w-5 h-5 text-green-500" />
  <SearchIcon className="w-6 h-6 text-primary-base" />
  ```
- **Tersedia**: `Calendar`, `Clock`, `User`, `Mail`, `Search`, `Eye`, `Download`, `Wa`, `Ig`, dll.

### 3D Icons (Premium)
Koleksi ikon 3D high-quality untuk memberikan impresi premium pada halaman utama atau section fitur.
- **Tersedia**: `Budaya3DIcon`, `EBook3DIcon`, `GroupStudy3DIcon`, `Interactive3DIcon`, `Lecture3DIcon`, `Study3DIcon`.
- **Note**: Ikon ini lebih berat secara visual, gunakan pada section-section strategis seperti Hero Section atau Card Feature.

---

## 4. Branding & Logo (`/src/logo`)

Komponen logo resmi untuk memastikan branding Nande Nihon selalu konsisten. Logo ini menggunakan format SVG sehingga tetap tajam di semua ukuran layar.

- **`NandeNihonLogo`**: Komponen utama yang menampilkan Logomark dan Logotype secara lengkap.
- **Customization**: Gunakan `className` untuk mengatur lebar logo sesuai kebutuhan container.
  ```tsx
  import { NandeNihonLogo } from "@repo/ui";
  
  // Ukuran standar di Navbar
  <NandeNihonLogo className="w-48 md:w-56" />

  // bisa custom variant, misalnya mau icon nande saja.
  <NandeNihonLogo variant="icon" />
  ```

---

## Pengembangan
Jika ingin menambah token baru, edit file `packages/ui/src/themes/tokens.css` di dalam blok `@theme`. Tailwind akan otomatis mengenali variabel baru tersebut.
