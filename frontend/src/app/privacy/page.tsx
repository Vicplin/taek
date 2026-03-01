import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <div className="container mx-auto px-4 pt-20 pb-16 flex-1">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -top-4 -left-2 w-4 h-4 border-t-2 border-l-2 border-arena-red" />
          <div className="absolute -top-4 -right-2 w-4 h-4 border-t-2 border-r-2 border-arena-red" />
          <div className="absolute -bottom-4 -left-2 w-4 h-4 border-b-2 border-l-2 border-arena-red" />
          <div className="absolute -bottom-4 -right-2 w-4 h-4 border-b-2 border-r-2 border-arena-red" />

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-orbitron font-bold tracking-[0.35em] uppercase">
                PRIVACY POLICY
              </h1>
              <p className="mt-3 text-xs md:text-sm text-gray-400">
                Last Updated: January 28, 2026
              </p>
            </div>

            <Link
              href="/"
              className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close and go back home"
            >
              <span className="text-lg">×</span>
            </Link>
          </div>

          <div className="mt-4 bg-[#121212] border border-white/5 rounded-2xl px-6 md:px-10 py-8 md:py-10 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <section className="space-y-8 text-sm md:text-base leading-relaxed text-gray-200">
              <div>
                <p className="mb-4">
                  TAEK is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard
                  your information when you use our tournament management platform. By using our services, you agree to the
                  practices described in this policy.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  1. Information We Collect
                </h2>
                <p className="mb-2">We collect the following information to provide tournament services:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Personal information: name, email, phone number, IC number, date of birth</li>
                  <li>Competition information: belt rank, weight class, age group, training academy</li>
                  <li>Technical information: IP address, device type, browser type, usage data</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  2. How We Use Your Information
                </h2>
                <p className="mb-2">We use your information to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Register you for tournaments and create competition brackets</li>
                  <li>Match you with appropriate opponents based on skill and weight class</li>
                  <li>Send tournament updates and important notifications</li>
                  <li>Improve our platform and user experience</li>
                  <li>Verify identities and ensure platform security</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  3. Information Sharing
                </h2>
                <p className="mb-2">We do not sell your personal information. We share information only with:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Tournament organizers: necessary registration and competition data</li>
                  <li>Your coach: performance data (only if you link your account to a coach)</li>
                  <li>Other participants: your player name, rank, and weight class appear in public brackets</li>
                  <li>Service providers: trusted third parties who help operate our platform</li>
                  <li>Legal authorities: when required by law</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  4. Data Security
                </h2>
                <p>
                  We use industry-standard security measures including encryption and secure servers to protect your information.
                  However, no internet transmission is completely secure. While we work to protect your data, you acknowledge the
                  inherent risks of online data transmission.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  5. Your Rights
                </h2>
                <p className="mb-2">You have the right to:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Access and review your personal information in your account settings</li>
                  <li>Update or correct your information at any time</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  6. Minors
                </h2>
                <p>
                  If you are under 18, your parent or legal guardian must create and manage your account. Parents are responsible
                  for providing accurate information and protecting account credentials.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  7. Policy Updates
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. Changes will be posted on our platform with an updated date.
                  Continued use of our services after changes indicates your acceptance of the updated policy.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  8. Governing Law
                </h2>
                <p>
                  This Privacy Policy is governed by the laws of Malaysia. Any disputes shall be resolved in Malaysian courts.
                </p>
              </div>

              <div>
                <p>
                  By using TAEK, you acknowledge that you have read and agree to this Privacy Policy.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="relative inline-flex items-center justify-center px-8 py-3 font-bold text-xs md:text-sm uppercase tracking-[0.3em] transition-all duration-300 border border-arena-red text-arena-red hover:bg-arena-red hover:text-white"
            >
              <span>BACK TO HOME</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
