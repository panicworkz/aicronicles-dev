/**
 * RAPOR DONEMLERI — icerik ve magaza icin TEK tanim.
 *
 * NEDEN VAR: her kutu kendi suresini kodunda tasiyordu. Okuma olcumu
 * son 30 gun, magaza son 12 hafta, yayin temposu son 12 ay. Ekrana
 * bakan kisi hangi rakamin hangi araliga ait oldugunu ancak aciklama
 * satirini okuyarak anliyordu — ve degistiremiyordu.
 *
 * BIRIM SURESINDEN CIKIYOR, elle secilmiyor: iki gunluk bir araligi
 * aya bolmek tek bir cubuk verir, iki yillik araligi gune bolmek yedi
 * yuz nokta. Kural asagida bir yerde duruyor ve her iki rapor da ona
 * uyuyor.
 *
 * "Tumu" icin baslangic 2020: Umami kaydi 2025 subatinda, magaza daha
 * yeni. Daha erken bir tarih vermek bos aylar eklemekten baska bir sey
 * yapmaz, daha gec vermek veri kirpar.
 */

export type DonemBirimi = "hour" | "day" | "month";

export type Donem = {
  kod: string;
  ad: string;
  bas: Date;
  son: Date;
  birim: DonemBirimi;
  /* Umami'ye gun sayisi olarak da gerekiyor. */
  gun: number;
};

export const DONEM_SECENEKLERI: { kod: string; ad: string; grup: string }[] = [
  { kod: "bugun", ad: "Today", grup: "Current" },
  { kod: "bu-hafta", ad: "This week", grup: "Current" },
  { kod: "bu-ay", ad: "This month", grup: "Current" },
  { kod: "bu-yil", ad: "This year", grup: "Current" },
  { kod: "7g", ad: "Last 7 days", grup: "Rolling" },
  { kod: "30g", ad: "Last 30 days", grup: "Rolling" },
  { kod: "90g", ad: "Last 3 months", grup: "Rolling" },
  { kod: "6a", ad: "Last 6 months", grup: "Rolling" },
  { kod: "12a", ad: "Last 12 months", grup: "Rolling" },
  { kod: "24a", ad: "Last 24 months", grup: "Rolling" },
  { kod: "36a", ad: "Last 3 years", grup: "Rolling" },
  { kod: "60a", ad: "Last 5 years", grup: "Rolling" },
  { kod: "tumu", ad: "All time", grup: "Rolling" },
];

export const VARSAYILAN_DONEM = "30g";

const GUN = 24 * 60 * 60 * 1000;

function birimSec(gun: number): DonemBirimi {
  if (gun <= 2) return "hour";
  if (gun <= 120) return "day";
  return "month";
}

/** Kodu gercek bir tarih araligina cevirir. Taninmayan kod varsayilana duser. */
export function donemCoz(kod?: string | null): Donem {
  const son = new Date();
  const secenek = DONEM_SECENEKLERI.find((d) => d.kod === kod);
  const gecerli = secenek?.kod ?? VARSAYILAN_DONEM;
  const ad = secenek?.ad ?? "Last 30 days";

  let bas: Date;

  switch (gecerli) {
    case "bugun":
      bas = new Date(son.getFullYear(), son.getMonth(), son.getDate());
      break;
    case "bu-hafta": {
      /* Hafta PAZARTESI basliyor. getDay() pazari 0 sayiyor; duzeltmeden
         kullanilirsa pazar gunu "bu hafta" bir onceki haftanin tamamini
         gosterir. */
      const g = son.getDay();
      const pazartesiyeKalan = (g + 6) % 7;
      bas = new Date(son.getFullYear(), son.getMonth(), son.getDate() - pazartesiyeKalan);
      break;
    }
    case "bu-ay":
      bas = new Date(son.getFullYear(), son.getMonth(), 1);
      break;
    case "bu-yil":
      bas = new Date(son.getFullYear(), 0, 1);
      break;
    case "tumu":
      bas = new Date(2020, 0, 1);
      break;
    default: {
      /* "7g" -> 7 gun, "6a" -> 6 ay. Ay hesabi gun carpimiyla degil
         takvimle yapiliyor: 6 x 30 gun, alti ay degil. */
      const sayi = parseInt(gecerli, 10);
      if (gecerli.endsWith("g")) {
        bas = new Date(son.getTime() - sayi * GUN);
      } else {
        bas = new Date(son.getFullYear(), son.getMonth() - sayi, son.getDate());
      }
    }
  }

  const gun = Math.max(1, Math.round((son.getTime() - bas.getTime()) / GUN));

  return { kod: gecerli, ad, bas, son, birim: birimSec(gun), gun };
}

/**
 * Araligi esit kovalara boler ve her kovanin etiketini uretir.
 *
 * Iki rapor da zaman serisi ciziyor; kova sinirlarini ayri ayri
 * hesaplasalardi ayni donemde farkli sayida nokta gosterebilirlerdi.
 */
export function kovalar(d: Donem): { bas: number; son: number; etiket: string }[] {
  const cikti: { bas: number; son: number; etiket: string }[] = [];

  if (d.birim === "hour") {
    const bas = new Date(d.bas);
    bas.setMinutes(0, 0, 0);
    for (let t = bas.getTime(); t < d.son.getTime(); t += 60 * 60 * 1000) {
      cikti.push({
        bas: t,
        son: t + 60 * 60 * 1000,
        etiket: new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      });
    }
    return cikti;
  }

  if (d.birim === "day") {
    const bas = new Date(d.bas);
    bas.setHours(0, 0, 0, 0);
    for (let t = bas.getTime(); t < d.son.getTime(); t += GUN) {
      cikti.push({
        bas: t,
        son: t + GUN,
        etiket: new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      });
    }
    return cikti;
  }

  const ilk = new Date(d.bas.getFullYear(), d.bas.getMonth(), 1);
  const sonAy = new Date(d.son.getFullYear(), d.son.getMonth(), 1);
  for (let a = new Date(ilk); a <= sonAy; a.setMonth(a.getMonth() + 1)) {
    const sonraki = new Date(a.getFullYear(), a.getMonth() + 1, 1);
    cikti.push({
      bas: a.getTime(),
      son: sonraki.getTime(),
      etiket: a.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
    });
  }
  return cikti;
}
