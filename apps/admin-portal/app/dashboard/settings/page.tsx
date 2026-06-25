export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Profile Settings */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-6">
                <h3 className="text-base font-bold text-neutral-90 mb-6">Profil Admin</h3>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary-base flex items-center justify-center text-absolute-white text-2xl font-bold">A</div>
                    <button className="text-sm font-medium text-primary-base bg-primary-10 hover:bg-primary-20 px-4 py-2 rounded-xl transition-all">Ubah Foto</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Nama Lengkap", value: "Admin Nande Nihon", type: "text" },
                        { label: "Email", value: "admin@nandenihon.com", type: "email" },
                        { label: "No. Telepon", value: "+62 812-3456-7890", type: "tel" },
                        { label: "Role", value: "Super Admin", type: "text", disabled: true },
                    ].map((field) => (
                        <div key={field.label} className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-60">{field.label}</label>
                            <input
                                type={field.type}
                                defaultValue={field.value}
                                disabled={field.disabled}
                                className="bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all disabled:text-neutral-40 disabled:cursor-not-allowed"
                            />
                        </div>
                    ))}
                </div>
                <button className="mt-6 bg-primary-base text-absolute-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    Simpan Perubahan
                </button>
            </div>

            {/* Password Settings */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-6">
                <h3 className="text-base font-bold text-neutral-90 mb-6">Ubah Password</h3>
                <div className="flex flex-col gap-4">
                    {[
                        { label: "Password Saat Ini", id: "current-password" },
                        { label: "Password Baru", id: "new-password" },
                        { label: "Konfirmasi Password Baru", id: "confirm-password" },
                    ].map((field) => (
                        <div key={field.id} className="flex flex-col gap-1">
                            <label className="text-sm font-semibold text-neutral-60">{field.label}</label>
                            <input
                                id={field.id}
                                type="password"
                                placeholder="••••••••"
                                className="bg-neutral-0 border border-neutral-20 rounded-xl py-2.5 px-4 text-sm text-neutral-80 outline-none focus:border-primary-base transition-all"
                            />
                        </div>
                    ))}
                </div>
                <button className="mt-6 bg-primary-base text-absolute-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary-80 transition-all">
                    Ubah Password
                </button>
            </div>

            {/* Notification Settings */}
            <div className="bg-absolute-white rounded-2xl border border-neutral-20 p-6">
                <h3 className="text-base font-bold text-neutral-90 mb-6">Notifikasi</h3>
                <div className="flex flex-col gap-4">
                    {[
                        { label: "Notifikasi Email", desc: "Terima notifikasi via email" },
                        { label: "Siswa Baru", desc: "Notifikasi ketika ada siswa baru mendaftar" },
                        { label: "Testimoni Baru", desc: "Notifikasi ketika ada testimoni baru masuk" },
                        { label: "Pendaftaran Seminar", desc: "Notifikasi pendaftaran seminar baru" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-neutral-80">{item.label}</p>
                                <p className="text-xs text-neutral-50">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                                <div className="w-11 h-6 bg-neutral-20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-base" />
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
