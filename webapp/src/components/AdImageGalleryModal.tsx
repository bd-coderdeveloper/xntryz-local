'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchFacebookToken, fetchAdImages, AdImage, AdAccount } from '@/utils/facebook';
import { Loader2, X, Image as ImageIcon, Search } from 'lucide-react';

interface AdImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  adAccount: AdAccount | null;
  onSelect: (image: AdImage) => void;
}

export default function AdImageGalleryModal({ isOpen, onClose, adAccount, onSelect }: AdImageGalleryModalProps) {
  const [images, setImages] = useState<AdImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen && adAccount) {
      loadImages();
    }
  }, [isOpen, adAccount]);

  const loadImages = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await fetchFacebookToken();
      const fetchedImages = await fetchAdImages(token, adAccount!.id);
      setImages(fetchedImages);
    } catch (err: any) {
      setError(err.message || 'Failed to load ad images');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const filteredImages = images.filter(img =>
    (img.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (img.hash?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-dark-900 border border-dark-700 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-dark-800 flex items-center justify-between bg-dark-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <ImageIcon className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">คลังรูปภาพจาก Meta Business</h2>
              <p className="text-xs text-dark-400 mt-0.5">เลือกรูปภาพจากบัญชีโฆษณา {adAccount?.name || adAccount?.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-dark-800 flex items-center gap-4 bg-dark-900">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search by filename or hash..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-dark-700 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-orange-500 text-sm transition-colors"
            />
          </div>
          <button
            onClick={loadImages}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            Refresh
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-dark-950/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-dark-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
              <p>กำลังโหลดรูปภาพ...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-400">
              <X className="w-8 h-8 mb-4 opacity-50" />
              <p>{error}</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-dark-400">
              <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>ไม่พบรูปภาพในบัญชีโฆษณานี้</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredImages.map((img) => (
                <button
                  key={img.hash}
                  onClick={() => {
                    onSelect(img);
                    onClose();
                  }}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-dark-800 hover:border-orange-500 transition-all bg-dark-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name || 'Ad Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-left">
                    <p className="text-white text-xs font-semibold truncate leading-tight">{img.name || 'Unnamed'}</p>
                    <p className="text-dark-300 text-[10px] font-mono truncate mt-0.5" title={img.hash}>{img.hash.substring(0, 8)}...</p>
                  </div>
                </button>
              ))}
              {filteredImages.length === 0 && searchTerm && (
                <div className="col-span-full py-12 text-center text-dark-400 text-sm">
                  ไม่มีรูปที่ตรงกับการค้นหา: "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}