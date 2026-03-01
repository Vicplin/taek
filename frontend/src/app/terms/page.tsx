import Link from 'next/link';

export default function TermsPage() {
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
                TERMS OF SERVICE
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
                <p>
                  These Terms of Service govern your use of the TAEK tournament management platform. By creating an account or
                  using our services, you agree to these terms. If you do not agree, you must discontinue use immediately.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  1. Account Registration
                </h2>
                <p>
                  You must provide accurate information when creating an account. You are responsible for maintaining the
                  security of your account credentials. All activities under your account are your responsibility. If you are
                  under 18, your parent or guardian must create and manage your account.
                </p>
                <p className="mt-2">
                  User roles include Normal User, Coach, Organiser, and Admin. Staff members access the platform through a
                  separate Staff Portal.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  2. Tournament Registration
                </h2>
                <p className="mb-2">Our eligibility system uses color coding:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>GREEN: Eligible to register</li>
                  <li>ORANGE: Coach approval required</li>
                  <li>RED: Not eligible</li>
                </ul>
                <p className="mt-2">
                  You must provide accurate information including IC number, weight class, and belt rank. Providing false
                  information will result in account termination and disqualification from tournaments.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  3. Prohibited Conduct
                </h2>
                <p className="mb-2">You may not:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Provide false information about belt rank, weight class, or eligibility</li>
                  <li>Impersonate another person or share your account</li>
                  <li>Attempt unauthorized access to the platform or other accounts</li>
                  <li>Interfere with platform operations or security</li>
                  <li>Use the platform for illegal purposes</li>
                  <li>Harass or threaten other users</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  4. Player Profile
                </h2>
                <p>
                  Our platform uses a 15-level belt ranking system. Weight classes are automatically calculated. Gender is
                  determined from your IC number (odd = male, even = female). You must keep your profile information current and
                  accurate for fair tournament matching.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  5. Platform Limitations
                </h2>
                <p className="mb-2">TAEK is a technology platform connecting players and organizers. We are not responsible for:</p>
                <ul className="space-y-1 list-disc list-inside mb-2">
                  <li>Operating or managing actual tournaments</li>
                  <li>Injuries sustained during tournament participation</li>
                  <li>Disputes between users, coaches, or organizers</li>
                  <li>Tournament cancellations or schedule changes</li>
                </ul>
                <p>
                  THE SERVICES ARE PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES. You assume all risks associated with tournament
                  participation. We do not guarantee uninterrupted or error-free service.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  6. Intellectual Property
                </h2>
                <p>
                  All content, design, features, and functionality of TAEK are owned by us and protected by intellectual
                  property laws. You may use the platform for its intended purpose but may not reproduce, modify, or distribute
                  any platform content without our written permission.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  7. Third-Party Authentication
                </h2>
                <p>
                  We offer Google OAuth for convenient login. By using Google Sign-In, you agree to provide your name and phone
                  number. Your use of Google services is subject to Google&apos;s terms and privacy policy.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  8. Account Termination
                </h2>
                <p>
                  We may suspend or terminate your account at any time for violation of these terms, fraudulent activity, or
                  behavior harmful to the platform or other users. We are not required to provide advance notice of termination.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  9. Changes to Terms
                </h2>
                <p>
                  We may modify these terms at any time. Changes will be posted with an updated date. Your continued use after
                  changes constitutes acceptance of the modified terms.
                </p>
              </div>

              <div>
                <h2 className="text-lg md:text-xl font-orbitron font-bold text-arena-red mb-3 uppercase tracking-wide">
                  10. Governing Law
                </h2>
                <p>
                  These terms are governed by Malaysian law. Any disputes shall be resolved exclusively in Malaysian courts.
                </p>
              </div>

              <div>
                <p>
                  BY USING TAEK, YOU ACKNOWLEDGE THAT YOU HAVE READ AND AGREE TO THESE TERMS OF SERVICE.
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
