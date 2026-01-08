import React from 'react';
import SubmissionForm from '@/components/SubmissionForm';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      {/* Arka Plan Gradyanları */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-20 px-4">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-gray-400">
            PixelArt 2026
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Geleceğin dijital sanatçılarını arıyoruz. En iyi eserini yükle,
            büyük sergide yerini al.
          </p>
        </div>

        <SubmissionForm />

        <footer className="mt-20 text-gray-500 text-sm">
          © 2026 PixelArt Organization. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
