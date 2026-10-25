# Onkoloji Konsey Sistemi

İzmir Şehir Hastanesi onkoloji konsey uygulaması. Linux sunucuda Docker ile çalışır. Örnek hasta ve hekim kaydı yoktur. İlk açılışta yalnız yönetici hesabı oluşturulur.

- Kullanıcı adı: `admin`
- Şifre: `9502457Ab!`

Girişten sonra bu şifreyi değiştirmeniz gerekir. Depo herkese açıksa şifreyi sunucuda hemen güncelleyin.

## Sunucuya kurulum

Sunucuda Docker ve Docker Compose kurulu olmalıdır. SSH ile bağlandıktan sonra:

```bash
git clone https://github.com/g0kh/konsey.git
cd konsey
export AUTH_SECRET="$(openssl rand -base64 32)"
docker compose --profile prod up -d --build
```

İlk açılış şemayı veritabanına uygular ve `admin` kullanıcısını oluşturur. Uygulama **3001** portundadır:

```bash
docker compose --profile prod ps
```

Tarayıcı: `http://SUNUCU-IP:3001`

Güncelleme:

```bash
cd konsey
git pull
docker compose --profile prod up -d --build
```

Veritabanı hacmi `konsey-db-data` içindedir. `docker compose down -v` bu hacmi siler.

## Yerel geliştirme

```bash
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```
