# Hướng Dẫn Deploy Lên Vercel

Dự án này đã được tối ưu hóa toàn diện để deploy lên Vercel. Hãy làm theo các bước sau để đưa website IELTS Mastery lên mạng (Production) với tên miền riêng.

## Bước 1: Chuẩn Bị Database (PostgreSQL)
Vercel serverless functions không hỗ trợ tốt SQLite cục bộ (`dev.db`). Bạn cần sử dụng một database cloud (khuyên dùng PostgreSQL).
1. Truy cập [Neon.tech](https://neon.tech/) hoặc [Supabase](https://supabase.com/) và tạo tài khoản miễn phí.
2. Tạo một Database mới.
3. Trong trang Dashboard của DB, tìm connection string (URL) có dạng: `postgresql://user:password@hostname/dbname?sslmode=require`. Copy đoạn này.
4. Mở file `prisma/schema.prisma` trong dự án và thay đổi:
   ```prisma
   datasource db {
     provider = "postgresql" // Đổi từ "sqlite" sang "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Chạy lệnh sau ở terminal dưới local để cập nhật cấu trúc DB lên cloud:
   `npx prisma db push` hoặc `npx prisma migrate dev`
   *(Lưu ý: Bạn phải gắn URL PostgreSQL vào `.env` ở local trước khi chạy lệnh này)*

## Bước 2: Chuẩn Bị GitHub
1. Mở GitHub và tạo một repository mới.
2. Push source code này lên GitHub repo đó.

## Bước 3: Đưa Lên Vercel
1. Truy cập [Vercel](https://vercel.com/) và đăng nhập bằng GitHub.
2. Bấm **"Add New Project"**, chọn repo GitHub mà bạn vừa push code lên.
3. Trong phần **"Environment Variables"** (Biến môi trường), hãy điền đầy đủ dựa trên file `.env.example`:
   - `DATABASE_URL`: Điền URL PostgreSQL bạn copy từ Bước 1
   - `AUTH_SECRET`: Tạo ngẫu nhiên (chạy lệnh `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: Địa chỉ web của bạn, tạm thời cứ nhập URL mặc định của Vercel sinh ra (sẽ thay đổi sau).
   - `NEXTAUTH_SECRET`: Bằng với `AUTH_SECRET`
   - `OPENAI_API_KEY`: Key API OpenAI của bạn

4. Nhấn **Deploy**.
   *(Hệ thống sẽ chạy lệnh `vercel-build` trong `package.json` để tự động push DB migrations và build web).*

## Bước 4: Tên Miền Riêng (Custom Domain)
1. Khi website đã được deploy lên Vercel, vào mục **Settings > Domains**.
2. Nhập tên miền riêng của bạn (ví dụ: `ieltsmastery.com`).
3. Vercel sẽ yêu cầu bạn trỏ bản ghi DNS:
   - Nếu dùng tên miền root (`domain.com`): Thêm bản ghi `A` trỏ về IP của Vercel (ví dụ `76.76.21.21`).
   - Nếu dùng sub-domain (`app.domain.com`): Thêm bản ghi `CNAME` trỏ về `cname.vercel-dns.com`.
4. Không quên quay lại mục **Environment Variables** cập nhật lại cẩn thận `NEXTAUTH_URL` bằng tên miền chính thức của bạn (vd: `https://ieltsmastery.com`) để tính năng đăng nhập không bị lỗi Callback.

## Bước 5: Cấu Hình Quản Trị
1. Đăng nhập bằng tài khoản `admin@ielts.com` (mật khẩu mặc định do bạn setup bằng user đăng ký đầu tiên trên DB mới hoặc chạy seed).
2. Vào **Dashboard Admin** nhập Key của cổng thanh toán Stripe.
