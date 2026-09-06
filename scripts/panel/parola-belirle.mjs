/**
 * Panic CMS yonetici parolasini belirler.
 *
 * Parola bu ekranda GORUNMEZ ve hicbir yere yazilmaz: dogrudan
 * bcrypt'ten gecirilip veritabanindaki hash guncellenir. Kimse
 * (ben dahil) parolayi gormez.
 *
 * Kullanim (sunucuda):
 *   docker exec -it panic-cms node /app/parola-belirle.mjs support@fabelo.io
 */
import readline from 'node:readline';
import { Writable } from 'node:stream';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const eposta = process.argv[2];
if (!eposta) {
  console.error('Kullanim: node parola-belirle.mjs <eposta>');
  process.exit(1);
}

/** Yazilani ekrana basmayan cikis. */
const sessiz = new Writable({
  write(parca, kodlama, geri) {
    if (!sessiz.gizle) process.stdout.write(parca, kodlama);
    geri();
  },
});

const tty = process.stdin.isTTY;

/* Boru ile beslendiginde butun satirlari bir kerede okuyup sirayla
   dagitiyoruz. Onceden her cagri icin ayri readline aciliyordu; boru
   uzerinde ikinci arayuz hicbir sey goremiyor, geri cagri hic
   tetiklenmiyor ve Node "cozulmemis top-level await" ile 13 kodunda
   oluyordu — ekrana tek satir bile basmadan. */
let kuyruk = null;
async function boruSatirlari() {
  if (kuyruk) return kuyruk;
  let ham = '';
  for await (const parca of process.stdin) ham += parca;
  kuyruk = ham.split('\n');
  return kuyruk;
}

async function sor(soru) {
  if (!tty) {
    const satirlar = await boruSatirlari();
    return (satirlar.shift() ?? '').trim();
  }
  return new Promise((coz) => {
    const arayuz = readline.createInterface({
      input: process.stdin,
      output: sessiz,
      terminal: true,
    });
    process.stdout.write(soru);
    sessiz.gizle = true;
    arayuz.question('', (cevap) => {
      sessiz.gizle = false;
      process.stdout.write('\n');
      arayuz.close();
      coz(cevap.trim());
    });
  });
}

/* Terminalde parola gizli sorulur. Boru ile calistirilirsa (test ya da
   otomasyon) iki satir okunur; gizlenecek bir ekran yoktur. */
const p1 = await sor('Yeni parola: ');
if (p1.length < 10) {
  console.error('Parola en az 10 karakter olmali.');
  process.exit(1);
}
const p2 = await sor('Tekrar: ');
if (p1 !== p2) {
  console.error('Parolalar eslesmedi.');
  process.exit(1);
}

const hash = await bcrypt.hash(p1, 12);
const istemci = new pg.Client({ connectionString: process.env.DATABASE_URL });
await istemci.connect();
const sonuc = await istemci.query(
  'UPDATE users SET password_hash = $1, updated_at = now() WHERE lower(email) = lower($2) RETURNING id, email',
  [hash, eposta]
);
await istemci.end();

if (!sonuc.rowCount) {
  console.error(`Boyle bir kullanici yok: ${eposta}`);
  process.exit(1);
}
console.log(`Parola guncellendi: ${sonuc.rows[0].email} (id ${sonuc.rows[0].id})`);
