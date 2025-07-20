import Image from 'next/image';
import Link from 'next/link';
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
} from 'react-icons/fa';
import { MdOutlineEmail } from 'react-icons/md';

const Footer = () => {
  return (
    <footer className="bg-white text-gray-800 py-8 sm:py-12">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center pb-8">
          <div className="mb-6 sm:mb-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/cropdirect-logo(black-text).png"
                alt="CropDirect Logo"
                width={200}
                height={200}
              />
            </Link>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 sm:mb-0">
            <Link href="/faq" className="hover:text-green-700 transition-colors">About</Link>
            <Link href="/contact" className="hover:text-green-700 transition-colors">Features</Link>
            <Link href="/blog" className="hover:text-green-700 transition-colors">FAQ</Link>
            <Link href="/help" className="hover:text-green-700 transition-colors">Contact Us</Link>
            <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-green-700 transition-colors"><FaFacebookF size={20} /></a>
            <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-green-700 transition-colors"><FaInstagram size={20} /></a>
            <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-green-700 transition-colors"><FaTwitter size={20} /></a>
            <a href="#" aria-label="LinkedIn" className="text-gray-500 hover:text-green-700 transition-colors"><FaLinkedinIn size={20} /></a>
            <a href="#" aria-label="YouTube" className="text-gray-500 hover:text-green-700 transition-colors"><FaYoutube size={20} /></a>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2">
            <p>&copy; {new Date().getFullYear()} CropDirect. All rights reserved.</p>
            <div className="flex items-center gap-2">
                <MdOutlineEmail/>
                <a href="mailto:support@cropdirect.com" className="hover:text-green-700 transition-colors">support@cropdirect.com</a>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 sm:mt-0">
            <Link href="/privacy" className="hover:text-green-700 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-green-700 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-green-700 transition-colors">Cookies Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
