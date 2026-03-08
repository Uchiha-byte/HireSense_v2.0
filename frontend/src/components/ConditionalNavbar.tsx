'use client';

import { usePathname } from 'next/navigation';
import Navbar from './NerdBusterHeaderLogo';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar on board and interview routes
  if (pathname?.startsWith('/board') || pathname?.startsWith('/coding-interview')) {
    return null;
  }


  // Show regular navbar everywhere else
  return <Navbar />;
}