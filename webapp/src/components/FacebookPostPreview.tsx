'use client';

import React from 'react';
import { Globe, MoreHorizontal, X, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

interface FacebookPostPreviewProps {
  pageName?: string;
  pageAvatar?: string;
  mode: 'A' | 'B';
  caption: string;
  primaryImageUrl?: string;
  secondaryImageUrl?: string;
  titleOne: string;
  titleTwo: string;
  displayLink: string;
  buttonType: string;
}

const BUTTON_LABELS: Record<string, string> = {
  NO_BUTTON: '',
  LEARN_MORE: 'Learn more',
  SHOP_NOW: 'Shop now',
  WATCH_MORE: 'Watch more',
  LISTEN_NOW: 'Listen now',
  PLAY_TIME: 'Play Time',
  VISIT_PAGES: 'Visit Pages',
  DOWNLOAD: 'Download',
  OPEN_LINK: 'Open link',
  BUY_NOW: 'Buy now',
  MESSAGE_PAGE: 'Send message',
  APPLY_NOW: 'Apply now',
  BOOK_TRAVEL: 'Book now',
  CONTACT_US: 'Contact us',
  SIGN_UP: 'Sign up',
  SUBSCRIBE: 'Subscribe',
  LIKE_PAGE: 'Like Page'
};

export default function FacebookPostPreview({
  pageName,
  pageAvatar,
  mode,
  caption,
  primaryImageUrl,
  secondaryImageUrl,
  titleOne,
  titleTwo,
  displayLink,
  buttonType
}: FacebookPostPreviewProps) {

  const resolvedPageName = pageName || 'Facebook Page';
  const resolvedAvatar = pageAvatar || 'https://scontent.fbkk35-1.fna.fbcdn.net/v/t1.30497-1/84628273_176159830277856_972693363922829312_n.jpg?stp=cp0_dst-jpg_p60x60&_nc_cat=1&ccb=1-7&_nc_sid=2dce53&_nc_ohc=80-IokJqK2EQ7kNvgEjNfU2&_nc_zt=24&_nc_ht=scontent.fbkk35-1.fna&edm=AP4hL3IEAAAA&_nc_gid=AXXV1GntHj6tG2f15q2j1i4&oh=00_AYBvUSaPof83j5QhA7Jp1L0Sls3qZgZKVX2MvO5VWeeGkQ&oe=67C92419'; // Default avatar

  const ctaText = BUTTON_LABELS[buttonType] || '';

  return (
    <div className="bg-white max-w-lg mx-auto border border-gray-200 rounded-lg shadow-sm font-sans flex flex-col text-[#050505] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between">
        <div className="flex gap-2.5">
          <img src={resolvedAvatar} alt="Page Avatar" className="w-[40px] h-[40px] rounded-full object-cover border border-gray-100" />
          <div className="flex flex-col">
            <h4 className="font-semibold text-[15px] leading-tight hover:underline cursor-pointer">{resolvedPageName}</h4>
            <div className="flex items-center text-[13px] text-[#65676B] gap-1 leading-tight mt-0.5">
              <span>Sponsored</span>
              <span>·</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 text-[#65676B] items-center pt-0.5">
          <MoreHorizontal className="w-5 h-5 cursor-pointer" />
          <X className="w-5 h-5 cursor-pointer" />
        </div>
      </div>

      {/* Caption Workspace */}
      {caption && caption.trim().length > 0 && (
        <div className="px-4 pb-3 text-[15px] leading-snug whitespace-pre-wrap">
          {caption}
        </div>
      )}

      {/* Media & Link Card */}
      {mode === 'A' ? (
        // Mode A: Single Link Card
        <div className="flex flex-col border-y border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors bg-[#f0f2f5]">
          <div className="w-full aspect-[1.91/1] bg-gray-200 relative">
            {primaryImageUrl ? (
              <img src={primaryImageUrl} className="w-full h-full object-cover" alt="Primary" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">กรุณาเลือกรูปภาพ</div>
            )}
          </div>
          <div className="flex items-center justify-between p-3 min-h-[72px]">
            <div className="flex flex-col flex-1 truncate pr-2">
              <span className="text-[12px] text-[#65676B] uppercase truncate leading-snug">{displayLink || 'upfeedth.com'}</span>
              <span className="font-semibold text-[15px] leading-tight text-[#050505] line-clamp-2 mt-0.5">{titleOne || ' '}</span>
            </div>
            {ctaText && buttonType !== 'NO_BUTTON' && (
              <button className="bg-gray-200/80 hover:bg-gray-300 font-semibold px-4 py-1.5 rounded-md text-[14px]">
                {ctaText}
              </button>
            )}
          </div>
        </div>
      ) : (
        // Mode B: Carousel Card
        <div className="flex overflow-x-hidden relative bg-white pb-3 pt-1">
          <div className="flex gap-2 px-4 w-full" style={{ scrollSnapType: 'x mandatory' }}>

            {/* Carousel Item 1 */}
            <div className="flex flex-col w-[85%] shrink-0 border border-gray-300 rounded-lg overflow-hidden snap-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-full aspect-square bg-gray-200">
                {primaryImageUrl ? (
                  <img src={primaryImageUrl} className="w-full h-full object-cover" alt="Primary" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                )}
              </div>
              <div className="flex flex-col p-3 pb-4 bg-white grow">
                <span className="font-semibold text-[15px] leading-tight text-[#050505] line-clamp-1">{titleOne || ' '}</span>
                <span className="text-[13px] text-[#65676B] truncate mt-0.5 line-clamp-1">{displayLink || 'upfeedth.com'}</span>
                {ctaText && buttonType !== 'NO_BUTTON' && (
                  <div className="mt-3">
                    <button className="w-full bg-gray-100 hover:bg-gray-200 font-semibold px-3 py-1.5 rounded-md text-[14px] text-[#050505]">
                      {ctaText}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Item 2 */}
            <div className="flex flex-col w-[85%] shrink-0 border border-gray-300 rounded-lg overflow-hidden snap-center cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-full aspect-square bg-gray-200">
                {(secondaryImageUrl || primaryImageUrl) ? (
                  <img src={secondaryImageUrl || primaryImageUrl} className="w-full h-full object-cover" alt="Secondary" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">กรุณาเลือกรูปภาพ</div>
                )}
              </div>
              <div className="flex flex-col p-3 pb-4 bg-white grow">
                <span className="font-semibold text-[15px] leading-tight text-[#050505] line-clamp-1">{titleTwo || ' '}</span>
                <span className="text-[13px] text-[#65676B] truncate mt-0.5 line-clamp-1">{displayLink || 'upfeedth.com'}</span>
                {ctaText && buttonType !== 'NO_BUTTON' && (
                  <div className="mt-3">
                    <button className="w-full bg-gray-100 hover:bg-gray-200 font-semibold px-3 py-1.5 rounded-md text-[14px] text-[#050505]">
                      {ctaText}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Engagement Actions */}
      <div className="px-4 py-2 border-t border-gray-200 mx-2 flex items-center justify-between font-semibold text-[#65676B] text-[15px]">
        <div className="flex items-center gap-2 hover:bg-gray-100 py-1.5 px-3 rounded-md cursor-pointer flex-1 justify-center">
          <ThumbsUp className="w-5 h-5" /> <span>Like</span>
        </div>
        <div className="flex items-center gap-2 hover:bg-gray-100 py-1.5 px-3 rounded-md cursor-pointer flex-1 justify-center">
          <MessageSquare className="w-5 h-5" /> <span>Comment</span>
        </div>
        <div className="flex items-center gap-2 hover:bg-gray-100 py-1.5 px-3 rounded-md cursor-pointer flex-1 justify-center">
          <Share2 className="w-5 h-5" /> <span>Share</span>
        </div>
      </div>
    </div>
  );
}