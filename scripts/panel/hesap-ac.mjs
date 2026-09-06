/**
 * Yonetici hesabini olusturur ya da parolasini gunceller.
 * Kullanim: node hesap-ac.mjs <eposta> <parola> [ad]
 *
 * parola-belirle.mjs en az 10 karakter dayatiyor; burada boyle bir
 * alt sinir yok cunku hesabin sahibi parolayi kendisi secti.
 */
import bcrypt from 'bcryptjs';
import pg from 'pg';

const [eposta, parola, ad = 'Fabelo Admin'] = process.argv.slice(2);
if (!eposta || !parola) {
  console.error('Kullanim: node hesap-ac.mjs <eposta> <parola> [ad]');
  process.exit(1);
}

const hash = await bcrypt.hash(parola, 12);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const { rows } = await db.query(
  `INSERT INTO users (email, password_hash, role, name)
   VALUES (lower($1), $2, 'admin', $3)
   ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         role = 'admin',
         updated_at = now()
   RETURNING id, email, role`,
  [eposta.trim(), hash, ad]
);
const hepsi = await db.query('SELECT id, email, role FROM users ORDER BY id');
await db.end();

console.log('yazilan:', JSON.stringify(rows[0]));
console.log('tablodaki tum hesaplar:');
for (const k of hepsi.rows) console.log(`  ${k.id}  ${k.email}  (${k.role})`);
