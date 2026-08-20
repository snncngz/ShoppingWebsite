# Lucien Perrin — Kullanıcı Rehberi

Bu dosya siteyi kullanan / yayınlayan kişi içindir. Secret değerleri buraya yazmayın.

---

## Canlı site

- Mağaza: Render’ın verdiği URL (örn. `https://shoppingwebsite-69kq.onrender.com`)
- Health: `https://SIZIN-URL.onrender.com/api/health` → `"database":"ok"` olmalı
- Admin giriş: `https://SIZIN-URL.onrender.com/admin/giris`

GitHub’a `main` push edince Render (Auto-Deploy açıksa) otomatik yeniden deploy eder. Ekstra bir şey yapmanız gerekmez; Logs’ta build’in yeşil bittiğini kontrol edin.

---

## Admin nasıl eklenir?

Env’e `ADMIN_EMAIL` / `ADMIN_PASSWORD` yazmak **tek başına yetmez**. Veritabanında kullanıcı oluşturmak gerekir.

### Yöntem A — Render Shell (ücretli planda)

1. Render → Web Service → **Shell**
2. Komut:

```bash
npm run create-admin
```

Bu komut Render Environment’taki `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` değerlerini kullanır.

### Yöntem B — Kendi bilgisayarınızdan (Free planda)

1. Render → PostgreSQL → **External Database URL** kopyalayın.
2. Proje klasöründe PowerShell:

```powershell
cd "c:\Users\sinan\Masaüstü\Sinan\Fırat_website"

$env:DATABASE_URL="EXTERNAL_URL_BURAYA?sslmode=require"
$env:ADMIN_EMAIL="admin@ornek.com"
$env:ADMIN_PASSWORD="EnAz8HarfVe1Rakam"
$env:ADMIN_NAME="Lucien Perrin Admin"

# Önemli: local .env External URL’yi ezmesin diye create-admin yerine
# geçici olarak şu şekilde de çalıştırabilirsiniz (tsx + upsert).
npm run create-admin
```

`create-admin` local `.env` / `.env.local` içindeki `DATABASE_URL`’i kullanabilir. Canlı DB’ye yazdığınızdan emin olun; External URL’yi kullandığınızı kontrol edin. Başarı mesajı: `Admin user ready: ...`

3. `https://SIZIN-URL.onrender.com/admin/giris` ile giriş yapın.

### Notlar

- Production’da `npm run db:seed` / `npm run seed` **çalıştırılmamalı** (engelli).
- Aynı e-posta ile tekrar `create-admin` çalıştırırsanız şifre ve rol güncellenir (upsert).
- Database URL / şifreleri GitHub’a, sohbete, bu dosyaya yazmayın.

---

## Admin panelde ne yapılır?

Giriş sonrası `/admin`:

- **Ürünler** — ekle / düzenle / gizle; fotoğraf yükle
- **Kategoriler**
- **Siparişler** — durum güncelle
- **Stok**

---

## GitHub → Render akışı

```text
Kod değiştir
  → git push (main)
  → Render otomatik build
  → Site güncellenir
```

Build komutu (Render Settings):

```bash
npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

Start:

```bash
npm run start
```

Health check path: `/api/health`

`API_BASE_URL` her zaman canlı site URL’iniz olmalı (örn. `https://shoppingwebsite-69kq.onrender.com`), sonda `/` olmasın.

Admin girişinde “Bu işlem için yetkiniz yok” görürseniz çoğu zaman eski Origin kontrolü / yanlış `API_BASE_URL` kaynaklıdır. Güncel kodda Render proxy header’ları dikkate alınır; yine de `API_BASE_URL`’i gerçek site adresiyle eşleştirip redeploy edin.

---

## Kategoriler neden boş görünebilir?

- Admin → Kategoriler yalnızca **PostgreSQL** kayıtlarını gösterir.
- Sitedeki menü (T-Shirt, Parfüm vb.) çoğu zaman **sabit navigasyon**dur; DB boş olsa bile görünür.
- Ürün formundaki kategori listesi de yedek olarak kod içi isimleri gösterir.
- Canlı DB’de kategori yoksa admin sayfasında **Toplam: 0** görürsünüz.

Varsayılan kategorileri doldurmak (bilgisayardan, External Database URL ile):

```powershell
$env:FORCE_DATABASE_URL="EXTERNAL_URL?sslmode=require"
npm run ensure-categories
```

Sonra `/admin/kategoriler` sayfasını yenileyin.

| Sorun | Ne yapın |
|--------|----------|
| Admin giriş olmuyor | Admin hiç oluşturulmamış olabilir → yukarıdaki adımlar |
| Site uykudan uyanıyor | Free plan; 30–60 sn bekleyin |
| Fotoğraflar görünmüyor | Eski yükleme `public/` altına yazılıyordu; Render’da çoğu zaman görünmez. Güncel kod `/api/uploads/...` ile sunar — GitHub’a push + redeploy şart. Sonra ürünü yeniden kaydedip fotoğrafı tekrar yükleyin. |
| Fotoğraflar redeploy sonrası siliniyor | Render Free disk kalıcı değil. Kalıcı çözüm: Render Disk veya bulut depolama (R2/S3). |
| Build Tailwind hatası | Build Command’te `npm ci --include=dev` kullanın |

Daha teknik detay: `docs/deployment.md`, `docs/production.md`.
