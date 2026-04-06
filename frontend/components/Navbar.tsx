'use client';

import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { AmaranLogo } from './AmaranLogo';

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(path);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Navbar glass background */}
      <div className="backdrop-blur-2xl bg-[#0B0B0B]/70 border-b border-[#C8A96A]/15">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          {/* Logo + Brand */}
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={handleNav('/')}
          >
            <div className="relative">
              <AmaranLogo size={40} />
              {/* Glow ring on hover */}
              <div className="absolute inset-0 rounded-full bg-[#C8A96A]/0 group-hover:bg-[#C8A96A]/10 transition-all duration-500 blur-md" />
            </div>
            <h1 className="text-2xl font-black tracking-wider font-display text-transparent bg-clip-text bg-gradient-to-r from-[#F5E6D3] via-[#C8A96A] to-[#C0C0C0] group-hover:from-[#C8A96A] group-hover:via-[#F5E6D3] group-hover:to-[#C8A96A] transition-all duration-500">
              AMARAN
            </h1>
          </motion.div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <motion.a
                  key={link.path}
                  href={link.path}
                  onClick={handleNav(link.path)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative px-5 py-2.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-r from-[#C8A96A]/20 to-[#C0C0C0]/10 text-[#C8A96A] border border-[#C8A96A]/30'
                      : 'text-[#C0C0C0] hover:text-[#F5E6D3] hover:bg-[#C8A96A]/8 border border-transparent hover:border-[#C8A96A]/15'
                    }
                  `}
                >
                  {link.label}
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#C8A96A]"
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    />
                  )}
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom accent line — gold to silver gradient */}
      <motion.div
        className="h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.6 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />
    </motion.nav>
  );
};
