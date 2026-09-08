import pg from "pg";
import { parse } from "node-html-parser";
import { htmlBloklara, bloklarHtmle } from "../src/lib/bloklar.ts";
const db=new pg.Client({connectionString:process.env.DATABASE_URL}); await db.connect();
const {rows}=await db.query("select slug, content_html from pages where content_html is not null order by slug");
const metin=h=>parse(h).textContent.replace(/\s+/g,"");
const isk=h=>{const o=[];const g=d=>{for(const c of d.childNodes)if(c.nodeType===1){o.push(c.tagName.toLowerCase());g(c);}};g(parse(h));return o;};
let temiz=0;
for(const s of rows){
  const geri=bloklarHtmle(htmlBloklara(s.content_html));
  const m=metin(s.content_html)===metin(geri);
  const A=isk(s.content_html), B=isk(geri);
  const i=A.findIndex((x,k)=>x!==B[k]);
  if(m && i<0) { temiz++; continue; }
  console.log(`✗ ${s.slug}  metin=${m?"ayni":"FARKLI"}  iskelet ilk fark=${i}`);
  if(i>=0) console.log("   once:",A.slice(Math.max(0,i-3),i+5).join(" "),"\n   sonra:",B.slice(Math.max(0,i-3),i+5).join(" "));
}
console.log(`\nsayfa: ${rows.length}  temiz: ${temiz}`);
await db.end();
