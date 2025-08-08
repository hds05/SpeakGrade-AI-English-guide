'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'; // HeroIcons for menu icons

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/#' },
  { name: 'Features', href: '/#' },
  { name: 'Games', href: '/game' },
  { name: 'Contact', href: '/#' },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="w-full sticky top-0 z-500 bg-white border-b shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center h-full text-4xl transition-colors duration-300"
        >
          {/* <img
    src="/speakgrade_logo.png"
    alt="SpeakGrade Logo"
    className="h-10 w-auto object-contain rounded-full mr-2"
  /> */}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            SpeakGrade
          </span>
        </Link>



        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium ${pathname === item.href
                ? 'text-purple-500'
                : 'text-gray-600 hover:text-purple-300'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-2xl text-purple-600"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t shadow-md">
          <nav className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMenu}
                className={`block text-base font-medium ${pathname === item.href
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-500'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
