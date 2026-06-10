# ⚡ APMS — خطوة واحدة متبقية للتشغيل الكامل

## ✅ تم إنجازه تلقائياً

| الخطوة | الحالة | الرابط |
|--------|--------|--------|
| GitHub | ✅ مرفوع | https://github.com/mohamedaliabouelfath1-ship-it/apms |
| Vercel | ✅ منشور | https://apms-eta.vercel.app |
| Supabase DB | ✅ جاهز | https://rbbcilzupeoxbydsqfky.supabase.co |
| Migrations | ✅ 3 ملفات | 30+ جدول |
| Bootstrap | ✅ شركة كيان | Kayan Environmental Services |

---

## 🔑 خطوة واحدة (دقيقتان) — مطلوبة منك

### 1. انسخ مفاتيح API من Supabase

افتح: **https://supabase.com/dashboard/project/rbbcilzupeoxbydsqfky/settings/api**

انسخ:
- **anon public** key
- **service_role** key (سري — لا تشاركه)

### 2. أضفها في Vercel

افتح: **https://vercel.com/mohamedaliaboulfath1-ship-its-projects/apms/settings/environment-variables**

أضف:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (service_role key) |

ثم اضغط **Redeploy** من Vercel → Deployments → Redeploy

### 3. إعداد Auth في Supabase

في **Authentication → URL Configuration**:

- **Site URL:** `https://apms-eta.vercel.app`
- **Redirect URLs:** `https://apms-eta.vercel.app/auth/callback`

### 4. إنشاء حسابك

1. افتح https://apms-eta.vercel.app/register
2. سجّل بإيميلك
3. في Supabase SQL Editor نفّذ:

```sql
UPDATE users
SET role = 'super_admin',
    company_id = 'a0000000-0000-0000-0000-000000000001'
WHERE email = 'mohamedaliabouelfath1@gmail.com';
```

4. سجّل دخول من https://apms-eta.vercel.app/login

---

## 🔒 تنبيه أمني

غيّر كلمة مرور قاعدة البيانات بعد الإعداد لأنها ظهرت في المحادثة.

---

## 📱 الروابط السريعة

- **التطبيق:** https://apms-eta.vercel.app
- **GitHub:** https://github.com/mohamedaliabouelfath1-ship-it/apms
- **Supabase:** https://supabase.com/dashboard/project/rbbcilzupeoxbydsqfky
- **Vercel:** https://vercel.com/mohamedaliabouelfath1-ship-its-projects/apms
