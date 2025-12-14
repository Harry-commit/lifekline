import React, { useState } from 'react';
import BaziForm from './components/BaziForm';
import LifeKLineChart from './components/LifeKLineChart';
import AnalysisResult from './components/AnalysisResult';
import { UserInput, LifeDestinyResult } from './types';
import { generateLifeAnalysis } from './services/geminiService';
import { API_STATUS } from './constants';
import { Sparkles, AlertCircle, BookOpen, Key } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LifeDestinyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const handleFormSubmit = async (data: UserInput) => {
    // 检查系统状态
    if (API_STATUS === 0) {
      setError("当前服务器繁忙，使用的用户过多导致API堵塞，请择时再来");
      // Removed scrollTo to keep user context
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setUserName(data.name || '');

    try {
      const analysis = await generateLifeAnalysis(data);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "命理测算过程中发生了意外错误，请重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-sc font-bold text-gray-900 tracking-wide">人生K线</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Life Destiny K-Line</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-sm text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
               基于 AI 大模型驱动
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-12">
        
        {/* If no result, show intro and form */}
        {!result && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
            <div className="text-center max-w-2xl flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-serif-sc font-bold text-gray-900 mb-6">
                洞悉命运起伏 <br/>
                <span className="text-indigo-600">预见人生轨迹</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                结合<strong>传统八字命理</strong>与<strong>金融可视化技术</strong>
                将您的一生运势绘制成类似股票行情的K线图。
                助您发现人生牛市，规避风险熊市，把握关键转折点。
              </p>

              {/* Tutorial Buttons Group */}
              <div className="flex flex-row gap-4 w-full max-w-lg mb-4">
                {/* 八字排盘 - 直接跳转到第三方排盘页 */}
                <a
                  href="https://pcbz.iwzwh.com/#/paipan/index"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl shadow-sm border border-indigo-100 hover:border-indigo-500 hover:shadow-md transition-all transform hover:-translate-y-0.5 group"
                >
                  <div className="bg-indigo-50 p-1.5 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-base font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">八字排盘</span>
                </a>

                {/* API 教程按钮已移除 */}
              </div>

              {/* 说明文字 */}
              <p className="text-sm text-gray-600 text-center max-w-lg leading-relaxed mt-4">
                <span className="font-bold text-gray-800">说明：</span>为了避免 AI 排的八字不准确，请进入第三方专业排盘软件排盘，后手动填入，以确保准确性。
              </p>
            </div>
            
            <BaziForm onSubmit={handleFormSubmit} isLoading={loading} />

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 max-w-md w-full animate-bounce-short">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="animate-fade-in space-y-12">
            
            <div className="flex justify-between items-center border-b pb-4">
               <h2 className="text-2xl font-bold font-serif-sc text-gray-800">
                 {userName ? `${userName}的` : ''}命盘分析报告
               </h2>
               <button 
                 onClick={() => setResult(null)}
                 className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
               >
                 ← 重新排盘
               </button>
            </div>

            {/* The Chart */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                 <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                 流年大运走势图 (100年)
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                <span className="text-green-600 font-bold">绿色K线</span> 代表运势下跌（凶），
                <span className="text-red-600 font-bold">红色K线</span> 代表运势上涨（吉）。
                (点击K线查看流年详批)
              </p>
              <LifeKLineChart data={result.chartData} />
            </section>

            {/* The Text Report */}
            <section>
               <AnalysisResult analysis={result.analysis} />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} 人生K线项目 | 仅供娱乐与文化研究，请勿迷信</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
