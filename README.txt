MOIT Follow-up System (Static + Firebase) — Netlify Ready (بدون Bootstrap Admin تلقائي)

1) Firebase Console:
   - Authentication: فعّل Email/Password
   - Firestore: أنشئ قاعدة البيانات
   - ضع Rules من ملف FIREBASE_RULES.txt

2) إنشاء مدير نظام (يدويًا — أكثر أمانًا):
   أ) أنشئ مستخدم Email/Password من Firebase Authentication.
   ب) من صفحة المستخدم في Authentication انسخ الـ UID.
   ج) Firestore -> Collection: users
      - أنشئ Document ID = نفس الـ UID
      - ضع الحقول التالية:
        {
          name: "اسم المدير",
          email: "admin@domain.com",
          role: "admin",
          status: "active",
          createdAt: serverTimestamp()
        }

3) تشغيل المستخدمين:
   - المستخدمون الجدد يسجلون من register.html وسيكون status=pending
   - المدير فقط هو من يحولهم إلى active أو blocked من admin.html

4) نشر Netlify:
   - ارفع المجلد كاملًا (كما هو) على Netlify (Drag & Drop أو Git)
