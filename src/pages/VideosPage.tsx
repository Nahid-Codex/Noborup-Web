import React, { useEffect } from 'react';
import {
  ExternalLink,
  Film,
  Share2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const VideosPage: React.FC = () => {
  const { videos, storeSettings, showToast } = useStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const publishedVideos = videos.filter((v) => v.isPublished);

  const facebookPageUrl =
    storeSettings.facebookURL || 'https://www.facebook.com/noborupstore.bd';
  const instagramUrl =
    storeSettings.instagramURL ||
    'https://www.instagram.com/noborupstore.bd?stkn=Y3RpODRyNGY2dHBi&fbclid=IwY2xjawVOau9leHRuA2FlbQIxMABwZG9mBWJyaWQRMXczVEJLRXRxNFNLbDhIZGlzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEe3-QFuPYUCDg7pTBba4lhOZKbSQXgCA1Po9usTKIXJwxYxe2eusFy-DoZ0KI_aem_W1fYqxbLd6JRPi6lm6yzow';

  const getFacebookEmbedUrl = (reelUrl: string) => {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      reelUrl
    )}&show_text=false&width=320&height=569`;
  };

  const handleCopyReelLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Reel link copied to clipboard!');
    } catch {
      showToast('Reel URL: ' + url, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] text-[#111312] dark:text-white pb-20 transition-colors duration-200">
      {/* Page Header */}
      <section className="bg-white dark:bg-[#1B1D1C] border-b border-black/8 dark:border-white/10 py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-[#FF8618] tracking-wide">
                Noborup Official Facebook Reels
              </p>
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Watch Noborup in Action
              </h1>
              <p className="text-sm sm:text-base text-[#4B504E] dark:text-[#B4B9B6] leading-relaxed">
                Official Facebook Reels straight from our Kedargonj Bazar showroom in Mujibnagar,
                Meherpur.
              </p>
            </div>

            {/* Official Social Channel Links */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={facebookPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs sm:text-sm transition-colors"
              >
                <span>Follow on Facebook (@noborupstore.bd)</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E1306C] hover:bg-[#c9265d] text-white font-semibold text-xs sm:text-sm transition-colors"
              >
                <span>Follow on Instagram (@noborupstore.bd)</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Facebook Reels Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {publishedVideos.map((video, idx) => (
            <div
              key={video.id}
              className="bg-white dark:bg-[#1B1D1C] rounded-2xl border border-black/8 dark:border-white/10 overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#FF8618] transition-colors max-w-sm sm:max-w-none mx-auto w-full"
            >
              {/* Top Header Bar */}
              <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-black/8 dark:border-white/10">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-[#FF8618]" />
                  <span>Facebook Reel #{idx + 1}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyReelLink(video.videoURL)}
                  aria-label="Share Reel Link"
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#686E6B] dark:text-[#9CA3AF] hover:text-[#111312] dark:hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Embedded Facebook Reel Video Stage */}
              <div className="relative aspect-9/16 bg-[#111312] overflow-hidden w-full flex items-center justify-center">
                <iframe
                  src={getFacebookEmbedUrl(video.videoURL)}
                  title={`Noborup Facebook Reel ${idx + 1}`}
                  className="w-full h-full border-0"
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Direct Facebook Link Footer */}
              <div className="px-4 py-3 border-t border-black/8 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#686E6B] dark:text-[#9CA3AF]">@noborupstore.bd</span>
                <a
                  href={video.videoURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#FF8618] font-semibold hover:underline"
                >
                  <span>Watch on Facebook</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
