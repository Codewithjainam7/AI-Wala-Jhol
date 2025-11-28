import React from 'react';
import { FileText, Image, FileUp, Sparkles } from 'lucide-react';

const features = [
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Text Analysis",
    desc: "Detect AI patterns in essays, blogs, and articles with linguistic forensics.",
    delay: "0ms"
  },
  {
    icon: <FileUp className="w-8 h-8" />,
    title: "Document Scan",
    desc: "Upload PDFs or Docs. We extract and analyze content structure deep within files.",
    delay: "100ms"
  },
  {
    icon: <Image className="w-8 h-8" />,
    title: "Image Detection",
    desc: "Spot deepfakes and AI-generated art using advanced visual artifact analysis.",
    delay: "200ms"
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Humanizer",
    desc: "Rewrite robotic content to sound natural, bypassing detection filters.",
    delay: "300ms"
  }
];

const FeatureCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 px-2 perspective-1000">
      {features.map((feature, idx) => (
        <div 
          key={idx}
          className="group relative h-56 w-full"
          style={{ animationDelay: feature.delay }}
        >
          {/* Card Container with 3D Transform */}
          <div className="absolute inset-0 transition-all duration-500 transform-gpu preserve-3d group-hover:rotate-y-12 group-hover:scale-105">
            
            {/* Front Face (Glass Card) */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl border border-white/10 shadow-xl backdrop-blur-md flex flex-col justify-between p-6 transition-all duration-500 group-hover:border-brand-red/40 group-hover:shadow-[0_0_30px_rgba(220,20,60,0.3)] group-hover:bg-white/5 overflow-hidden">
              
              {/* Internal Glow Blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-red/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content with Z-lift */}
              <div className="relative z-10 transform transition-transform duration-500 group-hover:translate-z-10">
                <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-brand-red mb-4 shadow-inner group-hover:scale-110 group-hover:bg-brand-red group-hover:text-white transition-all duration-500">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  {feature.desc}
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-brand-red to-brand-darkRed transition-all duration-700 group-hover:w-full" />
            </div>
            
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none overflow-hidden transition-opacity duration-500">
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] group-hover:animate-shine" />
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureCards;