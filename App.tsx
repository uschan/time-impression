
import React, { useState, Suspense } from 'react';
import { Menu, X, Box } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import PendulumEffect from './PendulumEffect';
import ChristmasTreeEffect from './ChristmasTreeEffect';
import SyntaxFreedomEffect from './SyntaxFreedomEffect';
import EntropyEffect from './EntropyEffect';
import GravityEffect from './GravityEffect';
import RippleEffect from './RippleEffect';
import SporeEffect from './SporeEffect';
import ChasmEffect from './ChasmEffect';
import ThreadEffect from './ThreadEffect';
import NeonEffect from './NeonEffect';
import GalaxyEffect from './GalaxyEffect';
import EclipseEffect from './EclipseEffect';
import VelocityEffect from './VelocityEffect';
import BloomEffect from './BloomEffect';
import NoirEffect from './NoirEffect';
import OrbEffect from './OrbEffect';
import SignalEffect from './SignalEffect';
import LensEffect from './LensEffect';
import KineticEffect from './KineticEffect';
import TemporalEffect from './TemporalEffect';
import WhaleFallEffect from './WhaleFallEffect';
import ErosionEffect from './ErosionEffect';
import FluidEffect from './FluidEffect';
import EmberEffect from './EmberEffect';
import KintsugiEffect from './KintsugiEffect';
import VaporEffect from './VaporEffect';

type Page = 'pendulum' | 'tree' | 'syntax' | 'entropy' | 'gravity' | 'ripple' | 'spore' | 'chasm' | 'thread' | 'neon' | 'galaxy' | 'eclipse' | 'velocity' | 'bloom' | 'noir' | 'orb' | 'signal' | 'lens' | 'kinetic' | 'temporal' | 'whalefall' | 'erosion' | 'fluid' | 'ember' | 'kintsugi' | 'vapor';

const PAGES: { id: Page; label: string; desc: string; type?: '2d' | '3d' }[] = [
  { id: 'vapor', label: 'VAPOR', desc: 'Retro synthwave' },
  { id: 'kintsugi', label: 'KINTSUGI', desc: 'Golden repair' },
  { id: 'ember', label: 'EMBER', desc: 'Irreversible loss' },
  { id: 'fluid', label: 'FLUID', desc: 'Magnetic grid flow' },
  { id: 'erosion', label: 'EROSION', desc: 'Structural collapse' },
  { id: 'whalefall', label: 'TEXTILE', desc: 'Woven fabric simulation' },
  { id: 'temporal', label: 'TEMPORAL', desc: 'Sands of time', type: '3d' },
  { id: 'orb', label: 'ORB', desc: 'Periodic elements' }, 
  { id: 'lens', label: 'LENS', desc: 'Liquid glass' },
  { id: 'kinetic', label: 'KINETIC', desc: 'Typography wave' },
  { id: 'signal', label: 'SIGNAL', desc: 'Digital interference' },
  { id: 'bloom', label: 'BLOOM', desc: 'Floral growth' },
  { id: 'noir', label: 'NOIR', desc: 'Smoky cinema' },
  { id: 'pendulum', label: 'IMPRESSION', desc: 'Time erases memory' },
  { id: 'tree', label: 'CHRISTMAS', desc: 'Festive structure' },
  { id: 'syntax', label: 'SYNTAX', desc: 'Freedom of lines' },
  { id: 'entropy', label: 'ENTROPY', desc: 'Order to chaos' },
  { id: 'gravity', label: 'GRAVITY', desc: 'Weight of concepts' },
  { id: 'ripple', label: 'RIPPLE', desc: 'Reflection in water' },
  { id: 'spore', label: 'SPORE', desc: 'Organic growth' },
  { id: 'chasm', label: 'CHASM', desc: 'Infinite abyss' },
  { id: 'thread', label: 'THREAD', desc: 'Invisible connections' },
  { id: 'neon', label: 'NEON', desc: 'Cyberpunk rain' },
  { id: 'galaxy', label: 'GALAXY', desc: 'Stardust cosmos' },
  { id: 'eclipse', label: 'ECLIPSE', desc: 'Shadow & Light' },
  { id: 'velocity', label: 'VELOCITY', desc: 'Warp speed' },
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('vapor');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dark mode detection based on current page
  const isDarkMode = ['neon', 'galaxy', 'chasm', 'eclipse', 'velocity', 'noir', 'orb', 'signal', 'kinetic', 'temporal', 'whalefall', 'fluid', 'ember', 'kintsugi', 'vapor'].includes(currentPage);

  const handlePageChange = (page: Page) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  const is3D = PAGES.find(p => p.id === currentPage)?.type === '3d';

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-1000 ${
      currentPage === 'temporal' ? 'bg-[#000]' :
      (currentPage === 'ember' ? 'bg-[#050100]' :
      (currentPage === 'vapor' ? 'bg-[#100020]' :
      (currentPage === 'kintsugi' ? 'bg-[#1a1a1a]' :
      (currentPage === 'whalefall' ? 'bg-[#0a0a0a]' :
      (currentPage === 'fluid' ? 'bg-[#0f172a]' :
      (currentPage === 'neon' || currentPage === 'velocity' || currentPage === 'signal' ? 'bg-[#05050a]' : 
      (currentPage === 'galaxy' || currentPage === 'eclipse' || currentPage === 'noir' || currentPage === 'orb' || currentPage === 'kinetic' ? 'bg-[#080808]' : 
      (currentPage === 'chasm' ? 'bg-[#111]' : 
      (currentPage === 'bloom' || currentPage === 'lens' ? 'bg-[#f8f8f8]' : 
      (currentPage === 'erosion' ? 'bg-[#e6e4e0]' :
      'bg-[#f5f5f5]'))))))))))
    }`}>
      
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
                onClick={() => handlePageChange(page.id)}
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

      {/* Content Area */}
      <div className="w-full h-full">
        {is3D ? (
          <Canvas
            camera={{ position: [0, 0, 30], fov: 35 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            className="w-full h-full"
          >
            <Suspense fallback={null}>
               {currentPage === 'temporal' && <TemporalEffect />}
            </Suspense>
          </Canvas>
        ) : (
          <>
            {currentPage === 'vapor' && <VaporEffect />}
            {currentPage === 'kintsugi' && <KintsugiEffect />}
            {currentPage === 'ember' && <EmberEffect />}
            {currentPage === 'erosion' && <ErosionEffect />}
            {currentPage === 'fluid' && <FluidEffect />}
            {currentPage === 'whalefall' && <WhaleFallEffect />}
            {currentPage === 'orb' && <OrbEffect />}
            {currentPage === 'pendulum' && <PendulumEffect />}
            {currentPage === 'tree' && <ChristmasTreeEffect />}
            {currentPage === 'syntax' && <SyntaxFreedomEffect />}
            {currentPage === 'entropy' && <EntropyEffect />}
            {currentPage === 'gravity' && <GravityEffect />}
            {currentPage === 'ripple' && <RippleEffect />}
            {currentPage === 'spore' && <SporeEffect />}
            {currentPage === 'chasm' && <ChasmEffect />}
            {currentPage === 'thread' && <ThreadEffect />}
            {currentPage === 'neon' && <NeonEffect />}
            {currentPage === 'galaxy' && <GalaxyEffect />}
            {currentPage === 'eclipse' && <EclipseEffect />}
            {currentPage === 'velocity' && <VelocityEffect />}
            {currentPage === 'bloom' && <BloomEffect />}
            {currentPage === 'noir' && <NoirEffect />}
            {currentPage === 'signal' && <SignalEffect />}
            {currentPage === 'lens' && <LensEffect />}
            {currentPage === 'kinetic' && <KineticEffect />}
          </>
        )}
      </div>

      {/* Minimal Footer (Hidden when menu open) */}
      {!isMenuOpen && (
        <div className={`absolute bottom-6 left-6 text-xs font-serif pointer-events-none transition-colors duration-1000 ${
          isDarkMode ? 'text-white/20' : 'text-black/20'
        }`}>
           {PAGES.find(p => p.id === currentPage)?.label}
        </div>
      )}
    </div>
  );
};

export default App;
