import React, { useState, useEffect } from 'react';
import { ScanResponse } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, BrainCircuit, Sparkles, FileText, ChevronRight, RotateCcw, Copy } from 'lucide-react';

interface ResultsViewProps {
  data: ScanResponse;
  onHumanize: () => void;
  isHumanizing: boolean;
  onScanAgain: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onHumanize, isHumanizing, onScanAgain }) => {
  // CRITICAL FIX: Ensure data structure is valid before destructuring
  if (!data.detection) {
    data.detection = {
      is_ai_generated: false,
      ai_probability: 0,
      human_probability: 1,
      risk_score: 0,
      risk_level: 'LOW',
      confidence: 'low',
      summary: 'Analysis incomplete',
      signals: [],
      model_suspected: null,
      detailed_analysis: 'No analysis available'
    };
  }

  // CRITICAL FIX: Ensure signals is always an array
  if (!Array.isArray(data.detection.signals)) {
    data.detection.signals = ['No specific signals detected'];
  }

  // CRITICAL FIX: Ensure recommendations is always an array
  if (!Array.isArray(data.recommendations)) {
    data.recommendations = [];
  }

  // CRITICAL FIX: Ensure humanizer exists
  if (!data.humanizer) {
    data.humanizer = {
      requested: false,
      humanized_text: null,
      changes_made: [],
      improvement_score: 0,
      notes: null
    };
  }

  const { detection, recommendations, humanizer } = data;
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the risk score counting up
  useEffect(() => {
    setAnimatedScore(0);
    const duration = 1500;
    const steps = 60;
    const intervalTime = duration / steps;
    const increment = (detection.risk_score || 0) / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= (detection.risk_score || 0)) {
        setAnimatedScore(detection.risk_score || 0);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [detection.risk_score]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-brand-red border-brand-red shadow-brand-red/20';
      case 'MEDIUM': return 'text-yellow-500 border-yellow-500 shadow-yellow-500/20';
      case 'LOW': return 'text-green-500 border-green-500 shadow-green-500/20';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-brand-red/10';
      case 'MEDIUM': return 'bg-yellow-500/10';
      case 'LOW': return 'bg-green-500/10';
      default: return 'bg-gray-400/10';
    }
  };

  const pieData = [
    { name: 'AI', value: (detection.ai_probability || 0) * 100 },
    { name: 'Human', value: (detection.human_probability || 0) * 100 },
  ];
  const COLORS = ['#DC143C', '#22c55e'];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Risk Score Card */}
        <div className={`glass-card p-6 rounded-xl flex flex-col items-center justify-center relative overflow-hidden ${getRiskBg(detection.risk_level)} animate-fade-up`}>
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2 z-10">AI Probability</h3>
          <div className="relative w-32 h-32 z-10 transform hover:scale-110 transition-transform duration-500 cursor-default">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    animationDuration={1500}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-3xl font-bold ${getRiskColor(detection.risk_level).split(' ')[0]}`}>
                  {animatedScore}%
                </span>
             </div>
          </div>
          <p className={`mt-2 font-bold z-10 tracking-widest ${getRiskColor(detection.risk_level).split(' ')[0]}`}>
            {detection.risk_level} RISK
          </p>
          {/* Subtle background glow based on risk */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 ${
              detection.risk_level === 'HIGH' ? 'bg-red-600' : detection.risk_level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
        </div>

        {/* Summary Card */}
        <div className="glass-card p-6 rounded-xl md:col-span-2 flex flex-col justify-between animate-fade-up animate-delay-100 group hover:bg-white/5 transition-colors duration-500">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="text-brand-red w-5 h-5 animate-pulse-slow" />
              <h3 className="text-white font-semibold text-lg">Analysis Summary</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base border-l-2 border-brand-red/50 pl-4 group-hover:border-brand-red transition-colors duration-300">
              {detection.summary || 'No summary available'}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
            {detection.model_suspected && (
               <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10 flex items-center gap-1.5 hover:border-brand-red/50 transition-colors cursor-default">
                 Suspected: <span className="text-brand-red font-semibold">{detection.model_suspected}</span>
               </span>
            )}
            <span className="px-3 py-1 rounded-full bg-white/5 text-xs text-gray-400 border border-white/10">
                 Confidence: <span className="capitalize font-medium text-white">{detection.confidence || 'unknown'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Signals & Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-xl animate-fade-up animate-delay-200">
           <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
             <AlertCircle className="w-5 h-5 text-brand-red" />
             Detected Signals
           </h3>
           <ul className="space-y-3">
             {/* CRITICAL FIX: Safe mapping with fallback */}
             {(Array.isArray(detection.signals) && detection.signals.length > 0 
               ? detection.signals 
               : ['No specific signals detected']
             ).map((signal, idx) => (
               <li 
                 key={idx} 
                 className="flex items-start gap-3 text-sm text-gray-300 bg-black/40 p-3 rounded-lg border border-white/5 hover:border-brand-red/30 transition-all duration-300 group hover:translate-x-1"
                 style={{ animationDelay: `${idx * 100}ms` }}
               >
                 <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0 group-hover:scale-150 group-hover:shadow-[0_0_8px_rgba(220,20,60,0.8)] transition-all" />
                 {signal}
               </li>
             ))}
           </ul>
        </div>

        <div className="glass-card p-6 rounded-xl animate-fade-up animate-delay-300">
           <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
             <FileText className="w-5 h-5 text-brand-red" />
             Detailed Analysis
           </h3>
           <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
             {detection.detailed_analysis || 'No detailed analysis available'}
           </p>
           
           <h4 className="text-white font-semibold mt-6 mb-3 text-sm uppercase flex items-center gap-2">
             <CheckCircle className="w-4 h-4 text-green-500" /> Recommendations
           </h4>
           <div className="flex flex-wrap gap-2">
             {/* CRITICAL FIX: Safe mapping for recommendations */}
             {(Array.isArray(recommendations) && recommendations.length > 0 
               ? recommendations 
               : ['No recommendations available']
             ).map((rec, idx) => (
               <span key={idx} className="px-3 py-1.5 rounded bg-brand-red/5 text-gray-300 text-xs border border-brand-red/10 hover:bg-brand-red/10 hover:text-white transition-colors cursor-default">
                 {rec}
               </span>
             ))}
           </div>
        </div>
      </div>

      {/* Humanizer Section */}
      <div className="glass-card p-1 rounded-xl bg-gradient-to-r from-brand-red/20 via-brand-black to-brand-red/20 animate-fade-up animate-delay-500 transform hover:scale-[1.01] transition-transform duration-500">
         <div className="bg-brand-black rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-white font-bold flex items-center gap-2 text-xl">
                <Sparkles className="text-brand-red animate-pulse" />
                Humanizer Engine
              </h3>
              {!humanizer.humanized_text && (
                <button 
                  onClick={onHumanize}
                  disabled={isHumanizing}
                  className={`
                    relative overflow-hidden px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg
                    ${isHumanizing 
                      ? 'bg-gray-800 text-gray-300 cursor-not-allowed border border-gray-700' 
                      : 'bg-brand-red hover:bg-brand-darkRed text-white shadow-brand-red/20 hover:shadow-brand-red/40'
                    }
                  `}
                >
                  {isHumanizing && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-[200%] animate-[shimmer_2s_infinite] translate-x-[-100%]" />
                  )}
                  {isHumanizing ? (
                    <>
                       <div className="w-4 h-4 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /> 
                       <span>Rewriting Patterns...</span>
                    </>
                  ) : (
                    <>Humanize Text <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>

            {humanizer.humanized_text ? (
              <div className="animate-fade-up">
                 <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 relative overflow-hidden group hover:border-brand-red/30 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-red/50" />
                    <p className="text-gray-200 whitespace-pre-wrap font-sans leading-relaxed relative z-10">
                      {humanizer.humanized_text}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigator.clipboard.writeText(humanizer.humanized_text || "")}
                        className="bg-black/80 hover:bg-black text-white text-xs px-3 py-1.5 rounded backdrop-blur flex items-center gap-1 border border-white/10"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                       <CheckCircle className="w-4 h-4 text-green-500" />
                       <span>Improvement Score: <strong className="text-white">{humanizer.improvement_score || 0}</strong></span>
                    </div>
                    {Array.isArray(humanizer.changes_made) && humanizer.changes_made.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                         <span className="text-gray-500">Changes:</span>
                         {humanizer.changes_made.map((change, i) => (
                           <span key={i} className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-300 border border-white/5">{change}</span>
                         ))}
                      </div>
                    )}
                 </div>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">
                AI Wala Jhol can rewrite this content to remove AI patterns and make it sound more natural. Click the button above to start the magic.
              </p>
            )}
         </div>
      </div>

      {/* Scan Again Button */}
      <div className="flex justify-center pt-8 animate-fade-up animate-delay-500">
        <button
          onClick={onScanAgain}
          className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3 rounded-full transition-all hover:scale-105 hover:border-brand-red/50 shadow-lg"
        >
           <RotateCcw className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
           Scan Another Content
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
