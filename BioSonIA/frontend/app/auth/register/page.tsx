'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Register
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      if (!res.ok) {
        throw new Error('Registration failed. Please try again.');
      }

      // 2. Login automatically
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const loginData = await loginRes.json();
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        router.push('/upload');
      } else {
        router.push('/auth/login');
      }

    } catch (err: any) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark transition-colors duration-300">
      <div className="flex min-h-screen">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary items-center justify-center p-12">
          <img 
            alt="Beautiful bird in nature" 
            className="absolute inset-0 object-cover w-full h-full opacity-60 mix-blend-multiply" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuOJHyUHMD96FCperERUl93M59YtzUnoWSCtHFSZiw1xOS4uY8GsJ1sK9J1nRlIe1ks1LHDr2_0EpfjRG0nj4aIauYKq8n2mNwnaoCpCBiWXN3WtxTZObcGDieiSaWtRA8p2hEUHFMQhQw7xKk82B3TkOjvSum9WrJKTJ7ehvnck2wPWlI9TQQeu8L4wwLvGoSJWlftwIx_kPTK-9eapsZaCGlYNlQuTbLgZirFxzBeMEiAHZ8Nx79pzmq8KiAHi0dKqTEJ_OGsEo"
          />
          <div className="relative z-10 max-w-lg text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="material-symbols-rounded text-primary text-3xl">waves</span>
              </div>
              <span className="text-3xl font-bold tracking-tight">BioSonIA</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">Identify Nature's Voice with AI.</h1>
            <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
              Our advanced neural networks analyze avian vocalizations to help researchers and enthusiasts monitor biodiversity in real-time.
            </p>
            <div className="backdrop-blur-md bg-white/10 p-6 rounded-2xl border border-white/20">
              <p className="italic text-emerald-50 mb-4">"BioSonIA has revolutionized how we conduct field surveys, making species identification faster and more accurate than ever."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-400"></div>
                <div>
                  <p className="font-semibold text-sm">Dr. Elena Rodriguez</p>
                  <p className="text-xs text-emerald-200 uppercase tracking-wider">Ornithologist & Researcher</p>
                </div>
              </div>
            </div>
          </div>
          <button 
            className="absolute top-8 right-8 p-2 rounded-full backdrop-blur-md bg-white/10 text-white hover:bg-white/20 transition-colors" 
            onClick={toggleDarkMode}
          >
            <span className="material-symbols-rounded dark:hidden">dark_mode</span>
            <span className="material-symbols-rounded hidden dark:block">light_mode</span>
          </button>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 lg:px-24 bg-white dark:bg-background-dark">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <span className="material-symbols-rounded text-primary text-4xl">waves</span>
            <span className="text-2xl font-bold dark:text-white">BioSonIA</span>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create an account</h2>
              <p className="text-gray-600 dark:text-gray-400">Join our community of bird enthusiasts</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button type="button" className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white text-sm font-medium">
                <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDo3UOPjnTKD5jVvMWRpJFJyXZ3EE-hIaas1MsxCGRRoBKZ6v3aGxFMgpiyLbR54Ps1yARdUIzA9ufyCESU_D3suHoLBTiNy-ITvInbVSdZWcJiZjIBqI8dxRQDKI-qbJxLh6BKThGj_Hx83HNtYVCxBI9twkecfO5i5VSA0mZyEDlcUCMKsR2fhCYcGMCzGCdxQUKNFdCvR12IK30sz7eijjxuj9xrStn_Rs3raA1_TuuSZ9UNqwpPcrmGsH29RGPLTZQAoN4WSmA"/>
                Google
              </button>
              <button type="button" className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors dark:text-white text-sm font-medium">
                <img alt="Facebook" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2SdF9Lt6WlnO3Vmua3BD1Md4sMI3COCF7l35hx_jf00xKYx9bQ0io8BOqmqYthwB8fcoF2sYcm4cj11kGbZp0B08SD6tuK_c2mAbAE_Hn6H-yYGKSl880arYTMmy_MyNdHEXklmv765m6CnkMvY_FoMXTT23lHQVwaTnvhvG3kn-MAxPe6Er0X6cCWSZlwQ-NS7u8x9lWXCNIPXw5Hr00dC6yki0Ne-8oxq_ezDXB4YdDrutYqayOAcdwbDDiymTv8TPzdTmQ8dI"/>
                Facebook
              </button>
            </div>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="px-2 bg-white dark:bg-background-dark text-gray-500 dark:text-gray-400">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="name">Full Name</label>
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  required 
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">Email address</label>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="Enter your email" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">Password</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 px-4 bg-primary hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg shadow-emerald-200 dark:shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                 {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account? 
              <Link href="/auth/login" className="ml-1 font-semibold text-primary hover:text-emerald-600 transition-colors">
                Log in
              </Link>
            </p>

            <div className="mt-12 flex justify-center gap-6 text-xs text-gray-500 dark:text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>

          <button 
            className="lg:hidden absolute top-8 right-8 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm"
            onClick={toggleDarkMode}
          >
            <span className="material-symbols-rounded dark:hidden">dark_mode</span>
            <span className="material-symbols-rounded hidden dark:block">light_mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}