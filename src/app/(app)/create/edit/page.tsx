"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditPage() {
  // Redirect to the new CapCut-style editor
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/create/editor');
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <div className="text-lg mb-2">Redirecting to Editor...</div>
        <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  );
}