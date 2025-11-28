import React from 'react';
import { Bot, User, ShieldCheck, Binary } from 'lucide-react';

const Background3D: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gradient Blob 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[120px] animate-pulse-slow" />
      
      {/* Gradient Blob 2 */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-darkRed/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Floating Card 1: AI Bot */}
      <div className="absolute top-[15%] left-[10%] opacity-20 animate-float perspective-1000 hidden lg:block">
        <div className="w-48 h-64 glass-card rounded-2xl transform rotate-[-12deg] p-6 flex flex-col justify-between border-brand-red/30">
          <Bot className="w-12 h-12 text-brand-red" />
          <div className="space-y-2">
            <div className="h-2 bg-white/20 rounded w-3/4" />
            <div className="h-2 bg-white/20 rounded w-full" />
            <div className="h-2 bg-white/20 rounded w-1/2" />
          </div>
          <div className="text-xs font-mono text-brand-red">AI DETECTED</div>
        </div>
      </div>

      {/* Floating Card 2: Human */}
      <div className="absolute bottom-[20%] left-[5%] opacity-10 animate-float-delayed perspective-1000 hidden lg:block">
        <div className="w-40 h-56 glass-card rounded-2xl transform rotate-[6deg] p-5 flex flex-col justify-between">
          <User className="w-10 h-10 text-green-500" />
          <div className="space-y-2">
            <div className="h-2 bg-white/20 rounded w-full" />
            <div className="h-2 bg-white/20 rounded w-2/3" />
          </div>
          <div className="text-xs font-mono text-green-500">HUMAN VERIFIED</div>
        </div>
      </div>

      {/* Floating Card 3: Code/Data */}
      <div className="absolute top-[20%] right-[10%] opacity-15 animate-drift perspective-1000 hidden md:block">
        <div className="w-64 h-40 glass-card rounded-2xl transform rotate-[3deg] p-6 flex flex-col justify-center border-white/20">
          <div className="flex items-center gap-3 mb-4">
             <Binary className="w-8 h-8 text-blue-400" />
             <div className="text-xs font-mono text-blue-400">ANALYZING PATTERNS</div>
          </div>
          <div className="flex gap-1 items-end h-16">
             <div className="w-4 bg-brand-red/40 h-[60%] rounded-t" />
             <div className="w-4 bg-brand-red/60 h-[80%] rounded-t" />
             <div className="w-4 bg-brand-red/30 h-[40%] rounded-t" />
             <div className="w-4 bg-brand-red/80 h-[90%] rounded-t" />
             <div className="w-4 bg-brand-red/50 h-[50%] rounded-t" />
             <div className="w-4 bg-brand-red/20 h-[30%] rounded-t" />
          </div>
        </div>
      </div>

      {/* Floating Shield */}
      <div className="absolute bottom-[10%] right-[20%] opacity-20 animate-float perspective-1000 hidden lg:block">
         <ShieldCheck className="w-32 h-32 text-white/10 transform -rotate-12" />
      </div>
    </div>
  );
};

export default Background3D;