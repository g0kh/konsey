export const BRANCHES = [
  "Tıbbi Onkoloji",
  "Radyasyon Onkolojisi",
  "Nükleer Tıp",
  "Radyoloji",
  "Girişimsel Radyoloji",
  "Tıbbi Genetik",
  "Patoloji",
  "Beyin Cerrahisi",
  "Jinekoonkoloji",
  "Üroloji/Üroonkoloji",
  "GİS Cerrahisi",
  "Hepatobilier Cerrahi",
  "Meme Cerrahisi",
  "Göğüs Cerrahisi",
  "Göğüs Hastalıkları",
  "Kulak Burun Boğaz",
] as const;

export type Branch = (typeof BRANCHES)[number];

/** İlk kurulumda oluşturulan yönetici. Başka örnek kullanıcı yoktur. */
export const ADMIN_USERS = [
  { username: "admin", name: "Admin Kullanıcı", branch: "Tıbbi Onkoloji" as const, role: "ADMIN" as const },
] as const;

/** Ham SQL sorgusu çalıştırabilen süper admin branşları */
export const SUPER_ADMIN_BRANCHES: readonly Branch[] = ["Tıbbi Onkoloji"];

export const COUNCIL_TYPES = [
  "Meme Konseyi",
  "Torasik Onkoloji Konseyi",
  "NRŞ Konseyi",
  "Jinekoonkoloji Konseyi",
  "GİS Konseyi",
  "Hepatobilier Konsey",
  "Baş Boyun Konseyi",
  "Üroonkoloji Konseyi",
] as const;

export type CouncilType = (typeof COUNCIL_TYPES)[number];

export const COUNCIL_TYPE_BRANCHES: Record<CouncilType, readonly Branch[]> = {
  "Meme Konseyi": [
    "Tıbbi Onkoloji",
    "Meme Cerrahisi",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
    "Tıbbi Genetik",
  ],
  "Torasik Onkoloji Konseyi": [
    "Tıbbi Onkoloji",
    "Göğüs Cerrahisi",
    "Göğüs Hastalıkları",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
  ],
  "NRŞ Konseyi": [
    "Nükleer Tıp",
    "Radyoloji",
    "Tıbbi Onkoloji",
    "Radyasyon Onkolojisi",
    "Patoloji",
  ],
  "Jinekoonkoloji Konseyi": [
    "Jinekoonkoloji",
    "Tıbbi Onkoloji",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
  ],
  "GİS Konseyi": [
    "GİS Cerrahisi",
    "Tıbbi Onkoloji",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
  ],
  "Hepatobilier Konsey": [
    "Hepatobilier Cerrahi",
    "Tıbbi Onkoloji",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
    "Girişimsel Radyoloji",
  ],
  "Baş Boyun Konseyi": [
    "Kulak Burun Boğaz",
    "Tıbbi Onkoloji",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
    "Beyin Cerrahisi",
  ],
  "Üroonkoloji Konseyi": [
    "Üroloji/Üroonkoloji",
    "Tıbbi Onkoloji",
    "Radyoloji",
    "Patoloji",
    "Radyasyon Onkolojisi",
    "Nükleer Tıp",
  ],
};
