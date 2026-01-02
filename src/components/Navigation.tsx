
import React from 'react';
import { Menu, X } from 'lucide-react';

export type PageId = 'pendulum' | 'syntax' | 'entropy' | 'ripple' | 'spore' | 'chasm' | 'neon' | 'eclipse' | 'velocity' | 'bloom' | 'noir' | 'orb' | 'signal' | 'lens' | 'kinetic' | 'temporal' | 'whalefall' | 'erosion' | 'fluid' | 'ember' | 'vapor' | 'harmonic';

export interface PageConfig {
  id: PageId;
  label: string;
  desc: string;
  type?: '2d' | '3d';
  theme: 'dark' | 'light';
}

export const PAGES: PageConfig[] = [
  { id: 'ember', label: 'EMBER', desc: 'Irreversible loss', theme: 'dark' },
  { id: 'fluid', label: 'FLUID', desc: 'Magnetic grid flow', theme: 'dark' },
  { id: 'erosion', label: 'EROSION', desc: 'Structural collapse', theme: 'light' },
  { id: 'whalefall', label: 'TEXTILE', desc: 'Woven fabric simulation', theme: 'dark' },
  { id: 'temporal', label: 'TEMPORAL', desc: 'Sands of time', type: '3d', theme: 'dark' },
  { id: 'orb', label: 'ORB', desc: 'Periodic elements', theme: 'dark' }, 
  { id: 'lens', label: 'LENS', desc: 'Liquid glass', theme: 'light' },
  { id: 'kinetic', label: 'KINETIC', desc: 'Typography wave', theme: 'dark' },
  { id: 'signal', label: 'SIGNAL', desc: 'Digital interference', theme: 'dark' },
  { id: 'vapor', label: 'VAPOR', desc: 'Window condensation', theme: 'dark' },
  { id: 'bloom', label: 'BLOOM', desc: 'Floral growth', theme: 'light' },
  { id: 'noir', label: 'NOIR', desc: 'Smoky cinema', theme: 'dark' },
  { id: 'pendulum', label: 'IMPRESSION', desc: 'Time erases memory', theme: 'light' },
  { id: 'syntax', label: 'SYNTAX', desc: 'Freedom of lines', theme: 'light' },
  { id: 'entropy', label: 'ENTROPY', desc: 'Order to chaos', theme: 'light' },
  { id: 'ripple', label: 'RIPPLE', desc: 'Reflection in water', theme: 'light' },
  { id: 'spore', label: 'SPORE', desc: 'Organic growth', theme: 'light' },
  { id: 'chasm', label: 'CHASM', desc: 'Infinite abyss', theme: 'dark' },
  { id: 'neon', label: 'NEON', desc: 'Cyberpunk rain', theme: 'dark' },
  { id: 'eclipse', label: 'ECLIPSE', desc: 'Shadow & Light', theme: 'dark' },
  { id: 'velocity', label: 'VELOCITY', desc: 'Warp speed', theme: 'dark' },
];

interface NavigationProps {
  currentPage: PageId;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  onPageChange: (page: PageId) => void;
  isDarkMode: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  isMenuOpen, 
  setIsMenuOpen, 
  onPageChange,
  isDarkMode 
}) => {
  return (
    <>
      {/* Menu Toggle Button */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className={`absolute top-6 right-6 z-50 p-2 rounded-full transition-all duration-300 ${
          isMenuOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        } ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/5'}`}
      >
        <Menu size={24} />
      </button>

      {/* Full Screen Overlay Menu */}
      <div 
        className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Close Button */}
        <button 
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-50"
        >
          <X size={32} />
        </button>

        {/* Menu Grid - Mobile Optimized */}
        <div className="flex-1 overflow-y-auto pt-24 pb-12 px-6 flex items-start justify-center">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl w-full">
            {PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 border ${
                  currentPage === page.id 
                    ? 'bg-white text-black border-white scale-100 shadow-xl' 
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm sm:text-lg font-serif font-bold tracking-wider truncate">{page.label}</h3>
                    {page.type === '3d' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        currentPage === page.id ? 'border-black text-black' : 'border-white/30 text-white/50'
                      }`}>3D</span>
                    )}
                  </div>
                  <p className={`text-[10px] sm:text-xs uppercase tracking-widest truncate w-full ${currentPage === page.id ? 'text-gray-500' : 'text-gray-400'}`}>
                    {page.desc}
                  </p>
                </div>
                {/* Decoration */}
                <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl transition-opacity duration-500 ${
                  currentPage === page.id ? 'bg-indigo-500/20' : 'bg-blue-500/0 group-hover:bg-blue-500/20'
                }`} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 text-center text-white/20 text-xs tracking-[0.3em] font-serif">
          TIME IMPRESSION COLLECTION
        </div>
      </div>
    </>
  );
};

export default Navigation;
