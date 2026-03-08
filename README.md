# Aura

A premium e-commerce platform built with **Next.js 16**, **TypeScript**, and **Supabase** — featuring three distinct interfaces for Customers, Admins, and Vendors.

## ✨ Features

- 🛍️ **Customer Interface** — Home, Products, Cart, Checkout, Account
- 🛠️ **Admin Interface** — Dashboard, Products, Orders, Users Management  
- 🏪 **Vendor Interface** — Dashboard, My Products, My Orders
- 🔐 **Supabase Auth** — Email/Password + Google & GitHub OAuth
- 📱 **Fully Responsive** — Mobile-first design with fluid typography
- 🔒 **Security Headers** — CSP, HSTS, X-Frame-Options, and more

## 🚀 Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) (Auth + Database)
- Vanilla CSS Modules
- [Lucide React](https://lucide.dev/) (Icons)

## 🏁 Getting Started

1. Clone the repo  
2. Copy `.env.example` → `.env.local` and fill in your Supabase keys  
3. Run the SQL from the [setup guide](./docs/supabase-setup.sql) in your Supabase dashboard
4. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/        # Admin interface
│   ├── vendor/       # Vendor interface
│   ├── auth/         # OAuth callback
│   ├── login/        # Login page
│   ├── register/     # Register page
│   ├── products/     # Product listing
│   ├── cart/         # Shopping cart
│   ├── checkout/     # Checkout flow
│   └── about/        # About page
├── components/
│   └── layout/       # Navbar, Footer
├── context/
│   └── AuthContext.tsx  # Supabase auth state
├── lib/
│   └── supabase/     # Client, server, middleware helpers
└── middleware.ts     # Route protection
```

## 🛡️ Security

- Role-based route protection via Next.js middleware
- Supabase Row Level Security on `user_roles` table
- Comprehensive CSP headers
- No secrets committed to repository

## 📄 License

MIT
