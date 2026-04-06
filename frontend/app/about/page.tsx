'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';

const teamMembers = [
  {
    name: 'Agile Srikanth',
    role: 'Software & AI Engineering',
    photo: '/team/srikanth.jpeg',
    bio: [
      "Hello! I'm Agile Srikanth, an enthusiastic student pursuing Electronics and Computer Science Engineering at Vellore Institute of Technology, Chennai.",
      "I have a strong passion for the software side of technology, with a particular interest in software engineering, prompt engineering, and building intelligent systems. I enjoy exploring how code, logic, and creativity come together to solve real-world problems and create impactful digital experiences.",
      "My focus lies in developing efficient solutions, experimenting with modern technologies, and continuously improving my skills in programming, system design, and AI-driven applications. I'm especially intrigued by the evolving field of prompt engineering, where I can combine technical knowledge with creativity to build smarter and more interactive systems.",
      "I am always eager to learn, build, and innovate — striving to grow as a developer while contributing to meaningful projects in the tech space.",
    ],
    socials: {
      linkedin: 'https://www.linkedin.com/in/agile-srikanth-a8b266322/',
      instagram: 'https://www.instagram.com/agilesrikanth/',
    },
  },
  {
    name: 'S.T. Sachin Samuel',
    role: 'Embedded Systems & IoT',
    photo: '/team/sachin.jpeg',
    bio: [
      "Hello! I'm S.T. Sachin Samuel, currently pursuing Electronics and Computer Science Engineering at Vellore Institute of Technology, Chennai.",
      "I have a strong passion for microcontrollers and enjoy working on IoT-based systems, where I can design and build practical, real-world projects. My interests lie in understanding how hardware and software integrate to create efficient and intelligent solutions.",
      "I am also deeply interested in embedded systems and quantum communications, and I have explored both areas through dedicated study and hands-on learning. These fields inspire me to dive deeper into advanced technologies and their future applications.",
      "I am driven by curiosity and a desire to innovate, constantly seeking opportunities to expand my knowledge and develop impactful solutions in the field of electronics and computing.",
    ],
    socials: {
      linkedin: 'https://www.linkedin.com/in/sachin-samuel-34446631b/',
      instagram: 'https://www.instagram.com/sachin._.2110?igsh=bDNzcXZxZWw0ZTVo',
    },
  },
];

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <section className="relative w-full min-h-screen pt-28 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[#0B0B0B] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-[#C8A96A]/8 to-transparent blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-[#C0C0C0]/5 to-transparent blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#C8A96A]/3 to-transparent blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">

          {/* Page Heading */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-8"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter font-display">
              <span className="text-gradient">About</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-6"
          >
            <p className="text-lg text-[#C0C0C0]/60 font-medium tracking-wide">
              The minds behind AMARAN
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-32 h-[2px] mx-auto mb-20 bg-gradient-to-r from-[#C8A96A] via-[#C0C0C0] to-[#C8A96A] rounded-full"
          />

          {/* Team Members */}
          <div className="flex flex-col gap-32">
            {teamMembers.map((member, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.25 }}
                  className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}
                >
                  {/* Photo Card */}
                  <div className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.04, y: -8 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="relative group"
                    >
                      {/* Glow behind photo */}
                      <div className="absolute -inset-3 bg-gradient-to-br from-[#C8A96A]/20 via-transparent to-[#C0C0C0]/15 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative w-64 h-80 md:w-[280px] md:h-[370px] rounded-2xl overflow-hidden border-2 border-[#C0C0C0]/15 group-hover:border-[#C8A96A]/40 transition-all duration-500 shadow-2xl shadow-black/50">
                        <Image
                          src={member.photo}
                          alt={member.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 256px, 280px"
                        />

                        {/* Overlay gradient at bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B]/80 via-transparent to-transparent" />

                        {/* Name overlay on photo */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-[#C8A96A] text-xs font-bold uppercase tracking-[0.2em]">
                            {member.role}
                          </p>
                        </div>

                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#C8A96A]/50 rounded-tl-2xl" />
                        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#C0C0C0]/30 rounded-br-2xl" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    {/* Name */}
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#F5E6D3] to-[#C8A96A]">
                        {member.name}
                      </h2>
                      <div className="mt-3 w-20 h-[2px] bg-gradient-to-r from-[#C8A96A] via-[#C0C0C0]/50 to-transparent rounded-full" />
                    </div>

                    {/* Bio */}
                    <div className="space-y-4">
                      {member.bio.map((paragraph, pIdx) => (
                        <motion.p
                          key={pIdx}
                          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.5 + pIdx * 0.1 }}
                          className="text-[#C0C0C0]/70 leading-relaxed text-[15px] md:text-base"
                        >
                          {paragraph}
                        </motion.p>
                      ))}
                    </div>

                    {/* Social Links */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                      className="flex items-center gap-3 pt-2"
                    >
                      <motion.a
                        href={member.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.08, y: -3, boxShadow: '0 8px 25px rgba(10, 102, 194, 0.25)' }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#0A66C2]/10 border border-[#0A66C2]/25 text-[#5B9BD5] hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/40 hover:text-[#7BB8F0] transition-all duration-300 font-semibold text-sm"
                      >
                        <LinkedInIcon />
                        LinkedIn
                      </motion.a>
                      <motion.a
                        href={member.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.08, y: -3, boxShadow: '0 8px 25px rgba(225, 48, 108, 0.25)' }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#E1306C]/10 border border-[#E1306C]/25 text-[#E1306C] hover:bg-[#E1306C]/20 hover:border-[#E1306C]/40 hover:text-[#FF5A8E] transition-all duration-300 font-semibold text-sm"
                      >
                        <InstagramIcon />
                        Instagram
                      </motion.a>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-28 text-center"
          >
            <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-[#C8A96A]/30 to-transparent mx-auto" />
            <p className="mt-6 text-[#C0C0C0]/30 text-sm font-medium tracking-widest uppercase">
              Built with passion at VIT Chennai
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}
