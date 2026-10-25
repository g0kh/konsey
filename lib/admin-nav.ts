export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "GENEL",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Sistem Durumu", href: "/admin/sistem" },
    ],
  },
  {
    title: "KONSEY",
    items: [
      { label: "Tüm Sunumlar", href: "/admin/sunumlar" },
      { label: "Konsey Oturumları", href: "/admin/oturumlar" },
      { label: "Konsey Kararları", href: "/admin/kararlar" },
    ],
  },
  {
    title: "KULLANICILAR",
    items: [
      { label: "Kullanıcı Listesi", href: "/admin/kullanicilar" },
      { label: "Kullanıcı Ekle", href: "/admin/kullanicilar?action=add" },
    ],
  },
  {
    title: "VERİTABANI",
    items: [
      { label: "Kayıt Sayıları", href: "/admin/veritabani" },
      { label: "Yedekleme", href: "/admin/veritabani#yedekleme" },
      { label: "Ham Sorgu", href: "/admin/veritabani#sorgu" },
    ],
  },
  {
    title: "RAPORLAR",
    items: [
      { label: "Konsey İstatistikleri", href: "/admin/raporlar" },
      { label: "Branş Aktivitesi", href: "/admin/raporlar#brans" },
      { label: "Aylık Özet", href: "/admin/raporlar#aylik" },
    ],
  },
];
