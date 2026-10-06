import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <div className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-slate-500">
          Last Updated: October 5, 2026
        </p>

        <div className="prose prose-blue mt-12 max-w-none text-slate-600">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Aryahs Business Manager (&quot;Aryahs&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your personal and business information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">2. Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us when you create an account, update your profile, or use our business management features. This includes personal information (such as your name and email address) and business data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">3. How We Use Information</h2>
            <p className="mb-4">
              We use the collected information to provide, maintain, and improve our services, including to facilitate billing, inventory management, and customer tracking. We may also use your information to communicate with you about service updates and support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">4. Business and Account Information</h2>
            <p className="mb-4">
              When you register, you provide your business name and contact details. This information is used exclusively to set up your account and enable you to use the Aryahs platform effectively.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">5. Billing and Transaction Data</h2>
            <p className="mb-4">
              As a business management tool, you will enter billing, invoice, and transaction data into the system. This data belongs to you. We process it solely to deliver the features of our application (e.g., generating reports, managing ledgers).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">6. Data Storage and Security</h2>
            <p className="mb-4">
              We implement reasonable security measures to protect your data against unauthorized access, alteration, or destruction. However, no internet transmission or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">7. Third-Party Services</h2>
            <p className="mb-4">
              We do not share your personal or business data with third parties for their own marketing purposes. We may use trusted third-party service providers (such as hosting providers) only to the extent necessary to operate our application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">8. Cookies and Analytics</h2>
            <p className="mb-4">
              Our website may use cookies and similar tracking technologies to ensure the application functions properly and to analyze usage patterns to improve user experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">9. Data Retention</h2>
            <p className="mb-4">
              We retain your personal and business data for as long as your account is active or as needed to provide you services, comply with our legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">10. User Rights</h2>
            <p className="mb-4">
              You have the right to access, update, or correct your personal and business information at any time through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">11. Account/Data Deletion</h2>
            <p className="mb-4">
              If you wish to delete your account and associated data, you can do so through the application or by contacting our support team. Upon deletion, your data will be removed from our active systems.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">12. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Our services are intended for business use and are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">13. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">14. Contact Information</h2>
            <p className="mb-4">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at support@aryahs.example.com.
            </p>
          </section>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-blue-600">ARYAHS</p>
            <p className="mt-1 text-xs text-slate-400">
              Business management made simple.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:gap-3">
            <Link href="/login" className="hover:text-blue-600">
              Login
            </Link>
            <span>|</span>
            <Link href="/register" className="hover:text-blue-600">
              Register
            </Link>
            <span>|</span>
            <Link href="/privacy-policy" className="hover:text-blue-600">
              Privacy Policy
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Aryahs
          </p>
        </div>
      </footer>
    </main>
  );
}
