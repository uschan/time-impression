
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

// UI Components - Explicit relative import
import Navigation, { PAGES, PageId } from './components/Navigation';

// Migrated Features
import VaporEffect from './features/vapor';
import EmberEffect from './features/ember';
import FluidEffect from './features/fluid';
import ErosionEffect from './features/erosion';
import WhaleFallEffect from './features/whalefall';
import PendulumEffect from './features/pendulum';
import SyntaxFreedomEffect from './features/syntax';
import EntropyEffect from './features/entropy';
import RippleEffect from './features/ripple';
import SporeEffect from './features/spore';
import ChasmEffect from './features/chasm';
import NeonEffect from './features/neon';
import EclipseEffect from './features/eclipse';
import VelocityEffect from './features/velocity';
import BloomEffect from './features/bloom';
import NoirEffect from './features/noir';
import OrbEffect from './features/orb';
import SignalEffect from './features/signal';
import LensEffect from './features/lens';
import KineticEffect from './features/kinetic';
import TemporalEffect from './features/temporal';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('vapor');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activePageConfig = PAGES.find(p => p.id === currentPage);
  const isDarkMode = activePageConfig?.theme === 'dark';
  const is3D = activePageConfig?.type === '3d';

  const handlePageChange = (page: PageId) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
  };

  // Background color mapping
  const getBgColor = (page: PageId) => {
    switch(page) {
      case 'temporal': return 'bg-[#000]';
      case 'ember': return 'bg-[#050100]';
      case 'vapor': return 'bg-[#020617]';
      case 'whalefall': return 'bg-[#0a0a0a]';
      case 'fluid': return 'bg-[#080808]';
      case 'neon':
      case 'velocity':
      case 'signal': return 'bg-[#05050a]';
      case 'eclipse':
      case 'noir':
      case 'orb':
      case 'kinetic': return 'bg-[#080808]';
      case 'chasm': return 'bg-[#050505]';
      case 'bloom':
      case 'lens': return 'bg-[#f8f8f8]';
      case 'erosion': return 'bg-[#e6e4e0]';
      default: return 'bg-[#f5f5f5]';
    }
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden transition-colors duration-1000 ${getBgColor(currentPage)}`}>
      
      <Navigation 
        currentPage={currentPage}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        onPageChange={handlePageChange}
        isDarkMode={isDarkMode}
      />

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
            {/* Features Migrated to New Structure */}
            {currentPage === 'vapor' && <VaporEffect />}
            {currentPage === 'ember' && <EmberEffect />}
            {currentPage === 'fluid' && <FluidEffect />}
            {currentPage === 'erosion' && <ErosionEffect />}
            {currentPage === 'whalefall' && <WhaleFallEffect />}
            {currentPage === 'pendulum' && <PendulumEffect />}
            {currentPage === 'syntax' && <SyntaxFreedomEffect />}
            {currentPage === 'entropy' && <EntropyEffect />}
            {currentPage === 'ripple' && <RippleEffect />}
            {currentPage === 'spore' && <SporeEffect />}
            {currentPage === 'chasm' && <ChasmEffect />}
            {currentPage === 'neon' && <NeonEffect />}
            {currentPage === 'eclipse' && <EclipseEffect />}
            {currentPage === 'velocity' && <VelocityEffect />}
            {currentPage === 'bloom' && <BloomEffect />}
            {currentPage === 'noir' && <NoirEffect />}
            {currentPage === 'orb' && <OrbEffect />}
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
           {activePageConfig?.label}
        </div>
      )}
    </div>
  );
};

export default App;
