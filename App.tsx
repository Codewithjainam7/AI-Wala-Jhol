import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import ResultsView from './components/ResultsView';
import Background3D from './components/Background3D';
import FeatureCards from './components/FeatureCards';
import CustomCursor from './components/CustomCursor';
import { ScanResponse, ScanMode } from './types';
import { Upload, Type, Image as ImageIcon, FileText, Loader2, History, X, ChevronRight, TrendingUp, BarChart2, BookOpen, PenTool, AlertTriangle, CheckCircle } from 'lucide-react';
import { APP_NAME } from './constants';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{name: string, type: string, data: string, size: number} | null>(null);
  const [activeTab, setActiveTab] = useState<ScanMode>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'learn'>('home');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CRITICAL FIX 1: New Storage Key to wipe bad data automatically ---
  useEffect(() => {
    // CRITICAL FIX: Clear old corrupted data
    localStorage.removeItem('awj_history');
    localStorage.removeItem('awj_history_v2');
    
    const saved = localStorage.getItem('awj_history_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Validate each item has proper structure
          const validated = parsed.filter(item => {
            return item && 
                   item.detection && 
                   typeof item.detection === 'object' &&
                   Array.isArray(item.detection.signals);
          });
          setHistory(validated);
        }
      } catch (e) {
        console.error("Error loading history:", e);
        localStorage.removeItem('awj_history_v3');
      }
    }
  }, []);

  // Save to the NEW key
  useEffect(() => {
    localStorage.setItem('awj_history_v3', JSON.stringify(history));
  }, [history]);

  // --- CRITICAL FIX 2: Safe Stats Calculation ---
  const historyStats = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return [...history].reverse().map((item, index) => {
      // CRITICAL FIX: Safe property access
      const riskScore = item?.detection?.risk_score ?? 0;
      const timestamp = item?.timestamp;
      const mode = item?.mode || 'text';
      
      return {
        name: `Scan ${index + 1}`,
        risk: riskScore,
        date: timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A',
        type: mode
      };
    });
  }, [history]);

  const typeDistributionStats = useMemo(() => {
    const stats = {
      text: { high: 0, medium: 0, low: 0 },
      file: { high: 0, medium: 0, low: 0 },
      image: { high: 0, medium: 0, low: 0 },
    };

    if (Array.isArray(history)) {
      history.forEach(item => {
        // CRITICAL FIX: Safe property access with proper fallbacks
        if (!item || !item.detection) return;
        
        const mode = (item.mode === 'video' ? 'file' : item.mode) || 'text';
        const riskLevel = (item.detection.risk_level || 'LOW').toUpperCase();
        
        let level: 'high' | 'medium' | 'low' = 'low';
        if (riskLevel === 'HIGH') level = 'high';
        else if (riskLevel === 'MEDIUM') level = 'medium';
        else level = 'low';
        
        if (stats[mode as keyof typeof stats]) {
          stats[mode as keyof typeof stats][level] += 1;
        }
      });
    }

    return [
      { name: 'Text', High: stats.text.high, Medium: stats.text.medium, Low: stats.text.low },
      { name: 'File', High: stats.file.high, Medium: stats.file.medium, Low: stats.file.low },
      { name: 'Image', High: stats.image.high, Medium: stats.image.medium, Low: stats.image.low },
    ];
  }, [history]);

  const handleReset = () => {
    setResult(null);
    setInputText('');
    setSelectedFile(null);
    setCurrentView('home');
  };

  const handleNavigate = (view: 'home' | 'learn') => {
    setCurrentView(view);
  };

  const handleHistoryClick = () => {
    setCurrentView('home');
    setShowHistory(true);
    setTimeout(() => {
      const historyElement = document.getElementById('history');
      if (historyElement) {
        historyElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleTabChange = (tab: ScanMode) => {
    setActiveTab(tab);
    setResult(null);
    setSelectedFile(null);
    setInputText('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) { 
        alert("File too large. Please select a file under 20MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64Data = result.split(',')[1];
        setSelectedFile({
          name: file.name,
          type: file.type,
          data: base64Data,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (activeTab === 'text' && !inputText.trim()) return;
    if (activeTab !== 'text' && !selectedFile) return;
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const payload = {
        mode: activeTab === 'image' ? 'image' : activeTab === 'file' ? 'file' : 'text',
        content: activeTab === 'text' ? inputText : selectedFile!.data,
        mimeType: activeTab === 'text' ? null : selectedFile!.type
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Server error");
      }
      
      const response = await res.json();

      // CRITICAL FIX: Comprehensive response validation
      if (!response.detection) {
          response.detection = {
              risk_score: 0,
              risk_level: 'LOW',
              summary: 'Analysis incomplete.',
              detailed_analysis: 'No details returned.',
              signals: [],
              is_ai_generated: false,
              ai_probability: 0,
              human_probability: 1,
              confidence: 'low',
              model_suspected: null
          };
      }

      // CRITICAL FIX: Ensure all detection fields are valid
      response.detection.risk_score = response.detection.risk_score ?? 0;
      response.detection.risk_level = response.detection.risk_level || 'LOW';
      response.detection.summary = response.detection.summary || 'Analysis completed';
      response.detection.detailed_analysis = response.detection.detailed_analysis || 'No detailed analysis available';
      response.detection.confidence = response.detection.confidence || 'low';
      response.detection.is_ai_generated = response.detection.is_ai_generated ?? false;
      response.detection.ai_probability = response.detection.ai_probability ?? 0;
      response.detection.human_probability = response.detection.human_probability ?? 1;
      response.detection.model_suspected = response.detection.model_suspected || null;

      // CRITICAL FIX: Force signals to be an array
      if (!Array.isArray(response.detection.signals) || response.detection.signals.length === 0) {
          response.detection.signals = ["No specific signals detected"];
      }

      // CRITICAL FIX: Ensure recommendations is an array
      if (!Array.isArray(response.recommendations)) {
          response.recommendations = ["Review manually", "Consider context"];
      }

      // CRITICAL FIX: Ensure humanizer exists
      if (!response.humanizer) {
          response.humanizer = {
              requested: false,
              humanized_text: null,
              changes_made: [],
              improvement_score: 0,
              notes: null
          };
      }

      if (activeTab === 'text') {
        response.file_info = { name: null, type: 'text', size_bytes: inputText.length, pages: null };
      } else {
        response.file_info = { 
          name: selectedFile!.name, 
          type: selectedFile!.type, 
          size_bytes: selectedFile!.size, 
          pages: null 
        };
      }
      
      response.mode = activeTab; 
      response.timestamp = new Date().toISOString();
      
      setResult(response);
      setHistory(prev => [response, ...prev]);
    } catch (error: any) {
      console.error("Analysis error:", error);
      alert(`Analysis failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanize = async () => {
    if (!result) return;
    setIsHumanizing(true);
    try {
      const payload = {
        mode: 'humanize',
        content: activeTab === 'text' ? inputText : selectedFile!.data,
        mimeType: activeTab === 'text' ? null : selectedFile!.type
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Humanize failed");
      const response = await res.json();

      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          humanizer: {
            requested: true,
            humanized_text: response.humanizer?.humanized_text || null,
            changes_made: Array.isArray(response.humanizer?.changes_made) 
              ? response.humanizer.changes_made 
              : [],
            improvement_score: response.humanizer?.improvement_score || 0,
            notes: response.humanizer?.notes || null
          }
        };
      });
    } catch (e) {
      console.error("Humanization error:", e);
      alert("Humanization failed. Please try again.");
    } finally {
      setIsHumanizing(false);
    }
  };

  const clearHistory = () => {
    if(confirm("Clear all history?")) {
      setHistory([]);
      localStorage.removeItem('awj_history_v3');
    }
  }

  const getAcceptTypes = () => {
    if (activeTab === 'file') return ".pdf";
    if (activeTab === 'image') return ".jpg,.jpeg,.png,.webp";
    return "*";
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-brand-red selection:text-white relative overflow-x-hidden">
      <CustomCursor />
      <Background3D />
      <div className="relative z-10">
      <Header 
        onGoHome={handleReset} 
        onNavigate={handleNavigate} 
        onHistoryClick={handleHistoryClick}
        currentView={currentView} 
      />

      <main className="max-w-5xl mx-auto px-4 mt-8 md:mt-12">
        {currentView === 'learn' ? (
          <div className="animate-fade-up">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                <BookOpen className="text-brand-red w-10 h-10" />
                How to Write Like a Human
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                AI detectors look for patterns, predictability, and perfection. 
                Human writing is chaotic, emotional, and flawed. Here is how to beat the algorithm.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
               <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Vary Sentence Length</h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                    AI tends to write sentences of average length. Humans mix it up. Use short punchy sentences.
                  </p>
               </div>
               <div className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-500">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Use Active Voice</h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                    Passive voice is a hallmark of academic and AI writing. Active voice shows agency and personality.
                  </p>
               </div>
            </div>

            <div className="text-center">
              <button onClick={() => setCurrentView('home')} className="bg-brand-red hover:bg-brand-darkRed text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-brand-red/20 transition-all hover:scale-105">
                Try the Scanner Now
              </button>
            </div>
          </div>
        ) : (
          /* Main Scanner View */
          <>
            {!result && (
              <div className="text-center mb-12 animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight">
                  Catch the AI Tricks.
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-10">
                  {APP_NAME} uses advanced Gemini AI models to analyze content patterns.
                </p>
                <FeatureCards />
              </div>
            )}

            {!result && (
            <div className="glass-card rounded-2xl p-1 mb-8 shadow-2xl shadow-black/50 animate-fade-up">
              <div className="flex border-b border-white/10 bg-black/40 rounded-t-xl overflow-hidden backdrop-blur-sm">
                <button onClick={() => handleTabChange('text')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === 'text' ? 'bg-white/10 text-brand-red border-b-2 border-brand-red' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}> <Type className="w-4 h-4" /> Text </button>
                <button onClick={() => handleTabChange('file')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === 'file' ? 'bg-white/10 text-brand-red border-b-2 border-brand-red' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}> <Upload className="w-4 h-4" /> PDF </button>
                <button onClick={() => handleTabChange('image')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${activeTab === 'image' ? 'bg-white/10 text-brand-red border-b-2 border-brand-red' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}> <ImageIcon className="w-4 h-4" /> Image </button>
              </div>

              <div className="bg-black/60 rounded-b-xl p-4 md:p-6 backdrop-blur-md">
                  <div className="min-h-[250px] mb-4">
                    {activeTab === 'text' ? (
                      <textarea className="w-full h-[250px] bg-transparent resize-none outline-none text-gray-300 placeholder-gray-600 text-lg leading-relaxed p-2" placeholder="Paste your text here to analyze..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
                    ) : (
                      <div onClick={() => !selectedFile && fileInputRef.current?.click()} className={`h-[250px] w-full flex flex-col items-center justify-center border-2 border-dashed ${selectedFile ? 'border-brand-red bg-brand-red/5' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-brand-red/50'} rounded-xl transition-all cursor-pointer group`}>
                        {selectedFile ? (
                          <div className="flex flex-col items-center animate-fade-in z-10 p-4 text-center">
                            <FileText className="text-brand-red w-12 h-12 mb-3 drop-shadow-lg" />
                            <p className="text-white font-medium text-lg max-w-xs truncate">{selectedFile.name}</p>
                            <button onClick={handleRemoveFile} className="bg-black/50 hover:bg-brand-red text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 border border-white/20 transition-colors mt-4"> <X className="w-4 h-4" /> Remove File </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-red/20 transition-all duration-300"> <Upload className="text-gray-500 group-hover:text-brand-red w-8 h-8 transition-colors" /> </div>
                            <p className="text-gray-400 font-medium group-hover:text-white transition-colors">Click to upload</p>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept={getAcceptTypes()} onChange={handleFileChange} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-white/5 pt-4">
                    <button onClick={handleAnalyze} disabled={isLoading || (activeTab === 'text' ? !inputText : !selectedFile)} className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-brand-red to-brand-darkRed hover:from-red-600 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-brand-red/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                      {isLoading ? ( <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> ) : ( <>Check for Jhol <ChevronRight className="w-4 h-4" /></> )}
                    </button>
                  </div>
              </div>
            </div>
            )}

            {result && (
              <div id="results" className="scroll-mt-24">
                <ResultsView data={result} onHumanize={handleHumanize} isHumanizing={isHumanizing} onScanAgain={handleReset} />
              </div>
            )}

            <div className="mt-12 flex justify-center pb-8" id="history">
              <button onClick={() => setShowHistory(!showHistory)} className="group flex items-center gap-2 text-sm uppercase tracking-widest text-gray-500 hover:text-brand-red transition-all">
                <History className="w-4 h-4 group-hover:rotate-12 transition-transform" /> 
                {showHistory ? 'Hide History' : 'View Scan History'}
              </button>
            </div>

            {showHistory && (
              <div className="animate-fade-up border-t border-white/10 pt-8 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"> <TrendingUp className="text-brand-red w-5 h-5" /> History Insights </h3>
                    <p className="text-sm text-gray-500 mt-1">Track your AI detection trends over time</p>
                  </div>
                  <button onClick={clearHistory} className="text-xs text-brand-red hover:text-red-400 px-3 py-1 rounded bg-brand-red/10 border border-brand-red/20 hover:bg-brand-red/20 transition-colors">Clear All Records</button>
                </div>

                {history.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="glass-card p-4 rounded-xl h-72 w-full flex flex-col">
                      <h4 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> AI Probability Trend</h4>
                      <div className="flex-1 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historyStats}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                              <XAxis dataKey="name" stroke="#555" tick={{fill: '#888'}} />
                              <YAxis stroke="#555" tick={{fill: '#888'}} domain={[0, 100]} />
                              <Tooltip />
                              <Area type="monotone" dataKey="risk" stroke="#DC143C" strokeWidth={2} name="Risk Score" />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl h-72 w-full flex flex-col">
                      <h4 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4"/> Risk Distribution by Type</h4>
                      <div className="flex-1 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typeDistributionStats}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                              <XAxis dataKey="name" stroke="#555" tick={{fill: '#888'}} />
                              <YAxis stroke="#555" tick={{fill: '#888'}} allowDecimals={false} />
                              <Tooltip />
                              <Legend wrapperStyle={{paddingTop: '10px'}} />
                              <Bar dataKey="Low" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
                              <Bar dataKey="Medium" stackId="a" fill="#eab308" radius={[0,0,0,0]} />
                              <Bar dataKey="High" stackId="a" fill="#DC143C" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4">
                  {history.length === 0 ? (
                    <p className="text-center text-gray-600 py-8 italic">No history found. Start analyzing content!</p>
                  ) : (
                    history.map((item, i) => (
                      <div key={(item?.scan_id || i) + Math.random()} className="glass-card p-4 rounded-lg flex justify-between items-center bg-black/40 border border-white/5 hover:bg-black/80 transition-all cursor-pointer group relative overflow-hidden" onClick={() => setResult(item)}>
                          <div className="flex items-center gap-4 relative z-10">
                            <div>
                              <p className="text-white font-medium truncate max-w-[200px] md:max-w-md group-hover:text-brand-red transition-colors">
                                {item?.detection?.summary || "Scan Result"}
                              </p>
                              <p className="text-xs text-gray-500 group-hover:text-gray-400">
                                {item?.timestamp ? new Date(item.timestamp).toLocaleString() : ""} • {item?.detection?.risk_level || "UNKNOWN"} Risk
                              </p>
                            </div>
                          </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
};

export default App;
