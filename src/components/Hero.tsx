import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Palette, Code, Layout, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative w-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden py-20">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center space-x-3 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
              <Palette className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-900">ACOM STUDIO</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 leading-[1.1] tracking-tighter">
            Solutions Créatives <br />
            <span className="text-primary italic">pour Marques Ambitieuses</span>
          </h1>

          <p className="text-lg text-gray-600 font-light leading-relaxed max-w-lg">
            Nous transformons vos idées en réalités numériques et physiques avec une précision artisanale et une vision stratégique.
          </p>

          <Link
            to="/quote-request"
            className="inline-flex items-center space-x-3 px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-primary transition-all group shadow-xl shadow-gray-900/20"
          >
            <span>Créer et commander</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Visual Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 p-8 aspect-[4/3] flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6 w-full">
              {[
                { icon: Palette, color: 'text-purple-500', bg: 'bg-purple-100' },
                { icon: Code, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                { icon: Layout, color: 'text-blue-500', bg: 'bg-blue-100' },
                { icon: Package, color: 'text-orange-500', bg: 'bg-orange-100' },
              ].map((item, i) => (
                <div key={i} className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <div className="h-2 w-20 bg-gray-100 rounded-full mb-2" />
                  <div className="h-2 w-12 bg-gray-50 rounded-full" />
                </div>
              ))}
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">ACOM STUDIO V2.0</div>
            <div className="absolute top-4 left-4 flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
