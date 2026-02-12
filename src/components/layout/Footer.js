import Link from 'next/link';

export default function Footer() {
  const footerLinks = {
    Platform: [
      { name: 'Browse Dommes', href: '/' },
      { name: 'Cities', href: '/cities' },
      { name: 'Verification', href: '/verification' },
      { name: 'Pricing', href: '/pricing' },
    ],
    Company: [
      { name: 'About Us', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
    ],
    Support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Safety', href: '/safety' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Report', href: '/report' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Content Policy', href: '/content-policy' },
    ],
  };

  return (
    <footer className="bg-[#0d0d0d] border-t border-gray-700">
      <div className="max-w-[1920px] mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-red-600 text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-lg">
                DOMME<span className="text-red-600">DIR</span>
              </span>
              <span className="text-gray-500 text-sm">
                © {new Date().getFullYear()}
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {['Twitter', 'Instagram', 'Discord'].map((social) => (
                <a
                  key={social}
                  href={`#${social.toLowerCase()}`}
                  className="text-gray-400 hover:text-red-600 text-sm transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-4 text-gray-500 text-xs">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
