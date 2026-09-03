# Lucien Perrin — Kullanıcı Rehberi

Secret / şifre / database URL bu dosyaya yazılmaz.

Canlı site adresinizi Render Web Service URL’si ile değiştirin  
(örnek: `https://shoppingwebsite-69kq.onrender.com`).

---

## İçindekiler

1. [Admin hesabı eklemek](#1-admin-hesabı-eklemek)
2. [Admin paneline giriş](#2-admin-paneline-giriş)
3. [Kategori eklemek](#3-kategori-eklemek)
4. [Varsayılan kategorileri toplu eklemek](#4-varsayılan-kategorileri-toplu-eklemek)
5. [Kodu canlıya almak](#5-kodu-canlıya-almak)

---

## 1) Admin hesabı eklemek

Render → Web Service → **Environment** içinde şunlar tanımlı olmalı:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (en az 8 karakter, harf + rakam)
- `ADMIN_NAME`

### A) Render Shell ile

1. Render → Web Service → **Shell**
2. Çalıştırın:

```bash
npm run create-admin
```

### B) Bilgisayardan

1. Render → PostgreSQL → **External Database URL** kopyalayın.
2. Proje klasöründe PowerShell:

```powershell
cd "c:\Users\sinan\Masaüstü\Sinan\Fırat_website"

$env:FORCE_DATABASE_URL="EXTERNAL_URL?sslmode=require"
$env:ADMIN_EMAIL="ornek@email.com"
$env:ADMIN_PASSWORD="GucluSifre1"
$env:ADMIN_NAME="Lucien Perrin Admin"

npm run create-admin
```

Başarı mesajı: `Admin user ready: ...`

Aynı e-posta ile tekrar çalıştırırsanız şifre ve admin rolü güncellenir.

> Bu işlem yalnızca veritabanına yazar. GitHub’a push etmeniz gerekmez.

---

## 2) Admin paneline giriş

```text
https://shoppingwebsite-69kq.onrender.com/admin/giris
```

Admin e-posta ve şifre ile giriş yapın.

---

## 3) Kategori eklemek

1. Admin → **Kategoriler**
2. **+ Yeni Kategori**
3. Ad ve açıklama girin
4. **Oluştur**

---

## 4) Varsayılan kategorileri toplu eklemek

```powershell
$env:FORCE_DATABASE_URL="EXTERNAL_URL?sslmode=require"
npm run ensure-categories
```

Parfüm, T-Shirt, Pantolon, Gömlek, Ceket, Aksesuar, Kemer, Çanta eklenir.

> Bu işlem de yalnızca veritabanına yazar; GitHub’a push gerekmez.

---

## 5) Kodu canlıya almak

1. Değişiklikleri kaydedin
2. GitHub `main` branch’ine push edin
3. Render otomatik deploy eder

---

Daha geniş kullanım adımları: [NASIL_KULLANILIR.md](./NASIL_KULLANILIR.md)
