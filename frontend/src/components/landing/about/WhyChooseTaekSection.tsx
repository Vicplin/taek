'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function WhyChooseTaekSection() {
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    const handleHighlight = () => {
      setHighlight(true);
      setTimeout(() => setHighlight(false), 1000); // Highlight for 1 seconds
    };

    window.addEventListener('highlight-about', handleHighlight);
    return () => window.removeEventListener('highlight-about', handleHighlight);
  }, []);

  const features = [
    {
      title: "Secure Registration",
      description: "Fast sign-ups with instant confirmation and payment processing.",
      icon: "🔒"
    },
    {
      title: "Live Rankings",
      description: "Real-time performance tracking and national ranking updates.",
      icon: "📊"
    },
    {
      title: "Smart Brackets",
      description: "AI-powered matchups ensuring fair and balanced competition.",
      icon: "🤖"
    },
    {
      title: "Streamlined UI",
      description: "Intuitive interfaces designed for players, coaches, and organisers.",
      icon: "⚡"
    },
    {
      title: "Achievement System",
      description: "Earn digital badges and milestones for your competitive journey.",
      icon: "🏆"
    },
    {
      title: "Verified Results",
      description: "Official tournament results stored permanently on your profile.",
      icon: "✅"
    }
  ];

  return (
    <section id="about" className="py-24 bg-deep-black container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className={`text-5xl font-orbitron font-medium text-white mb-4 transition-all duration-500 ${highlight ? 'drop-shadow-[0_0_15px_rgba(230,57,70,0.8)] scale-105' : ''}`}>
          Why Choose <span className={`text-arena-red transition-all duration-500 ${highlight ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)]' : ''}`}>TAEK</span>
        </h2>
        <p className="text-gray-500 font-rajdhani text-lg">
          The complete tournament management platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-[#151515] p-10 rounded-xl hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="text-2xl mb-6 bg-[#2A0E11] w-12 h-12 flex items-center justify-center rounded-lg text-arena-red">
              {feature.icon === "🔒" && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
              {feature.icon === "📊" && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {feature.icon === "🤖" && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
              {feature.icon === "⚡" && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {feature.icon === "🏆" && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              )}
              {feature.icon === "✅" && (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
