# Panel hesap betikleri

Panic CMS'in yonetici hesaplari `users` tablosunda duruyor ve panelde
hesap ekleme ekrani yok. Bu iki betik o boslugu dolduruyor. Ikisi de
konteynerin icinde calisiyor; `DATABASE_URL` ve `bcryptjs` orada hazir.

Betikler `/opt/panic/` altina kopyalanip imaja giriyor
(`docker compose build` sirasinda `COPY . .` ile). Yani sunucuda
`/app/` altindan cagriliyorlar.

## Parolayi degistirmek

```
ssh -t root@<sunucu> 'DOCKER_HOST=unix:///var/run/docker-panic.sock \
  docker exec -it panic-cms node /app/parola-belirle.mjs <eposta>'
```

Parolayi **gizli** sorar, ekrana basmaz, iki kez ister, en az 10
karakter dayatir. `-it` sart: TTY'yi oradan aliyor. TTY yoksa (boru ile
calistirilirsa) iki satir okur — otomasyon icin.

Bir uyari: ilk yazdigimda boru ile calistirilinca hicbir sey basmadan
13 koduyla oluyordu. Her cagri icin ayri bir `readline` aciliyor, boru
uzerinde ikincisi hicbir sey goremiyor ve geri cagri hic
tetiklenmiyordu — Node da "cozulmemis top-level await" diye sessizce
cikiyordu. Simdi boru girdisi bir kerede okunup sirayla dagitiliyor.

## Hesap acmak (ya da parolayi disaridan vermek)

```
docker exec panic-cms node /app/hesap-ac.mjs <eposta> <parola> [ad]
```

Varsa gunceller, yoksa acar; rol her durumda `admin`. Parola komut
satirinda gectigi icin kabuk gecmisine yazilir — gunluk kullanim icin
`parola-belirle.mjs` tercih edilmeli. Bu betik alt sinir dayatmaz,
cunku parolayi hesabin sahibi seciyor.

## Not

`users` tablosuna bagli yabanci anahtar yok; bir hesabi silmek baska
hicbir kaydi etkilemiyor. Yazilar `authors` tablosuna bagli, `users`'a
degil.
