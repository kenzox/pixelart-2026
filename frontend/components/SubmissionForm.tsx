'use client';

import React, { useState, useRef } from 'react';

export default function SubmissionForm() {
    const [formData, setFormData] = useState({
        artistName: '',
        description: '',
        email: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setStatus('error');
            setMessage('Lütfen bir eser dosyası yükleyin.');
            return;
        }

        setStatus('loading');
        setMessage('');

        const data = new FormData();
        data.append('artist_name', formData.artistName);
        data.append('description', formData.description);
        data.append('email', formData.email);
        data.append('file', file);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
            const response = await fetch(`${apiUrl}/api/submit-art`, {
                method: 'POST',
                body: data,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gönderim başarısız oldu.');
            }

            setStatus('success');
            setMessage('Başvurunuz alındı! Lütfen mail kutunuzu kontrol ediniz.');
            setFormData({ artistName: '', description: '', email: '' });
            setFile(null);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Sanatçı Başvuru Formu
            </h2>

            {status === 'success' ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">Başarılı!</h3>
                    <p className="text-gray-300">{message}</p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                        Yeni Başvuru Yap
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">İsim Soyisim</label>
                        <input
                            type="text"
                            name="artistName"
                            value={formData.artistName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                            placeholder="Sanatçı adınız"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">E-posta Adresi</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500"
                            placeholder="ornek@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Eser Açıklaması</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-500 resize-none"
                            placeholder="Eseriniz hakkında kısa bir açıklama..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Eser Yükle (PDF, JPG, PNG - Max 5MB)</label>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={onButtonClick}
                            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${dragActive
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : file
                                        ? 'border-green-500/50 bg-green-500/5'
                                        : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                                }`}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <div className="text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 md:w-8 md:h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-green-400 font-medium break-all px-4">{file.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-300 font-medium">Dosyayı buraya sürükleyin</p>
                                    <p className="text-sm text-gray-500 mt-1">veya seçmek için tıklayın</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={`w-full py-4 rounded-xl font-semibold text-white transition-all transform duration-200 ${status === 'loading'
                                ? 'bg-gray-700 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] shadow-lg hover:shadow-purple-500/25'
                            }`}
                    >
                        {status === 'loading' ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Gönderiliyor...
                            </span>
                        ) : (
                            'Başvuruyu Gönder'
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
