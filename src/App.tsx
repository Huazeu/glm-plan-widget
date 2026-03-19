import { useState, useEffect } from 'react';
import { X, RefreshCw, Clock, Activity, Settings, Save } from 'lucide-react';
import { fetchUsageData } from './api';
import type { UsageData, TimeRange } from './api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'model' | 'tool'>('model');
  
  // Settings state
  const [token, setToken] = useState(localStorage.getItem('glm_token') || '');
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem('glm_baseUrl') || 'https://open.bigmodel.cn');
  const [timeRange, setTimeRange] = useState<TimeRange>((localStorage.getItem('glm_timeRange') as TimeRange) || 'today');
  
  // Data state
  const [data, setData] = useState<UsageData>({
    modelUsage: 0,
    toolUsage: 0,
    tokensPercentage: 0,
    mcpPercentage: 0,
    chartData: []
  });

  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--');

  const handleClose = () => {
    if (window.electron) {
      window.electron.closeWindow();
    }
  };

  const loadData = async () => {
    if (!token || !baseUrl) {
      setShowSettings(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUsageData(baseUrl, token, timeRange);
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || '获取数据失败，请检查配置或网络');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto refresh every 5 minutes
    const timer = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [timeRange]); // reload when timeRange changes

  const saveSettings = () => {
    localStorage.setItem('glm_token', token);
    localStorage.setItem('glm_baseUrl', baseUrl);
    localStorage.setItem('glm_timeRange', timeRange);
    setShowSettings(false);
    loadData();
  };

  const timeRangeLabels = {
    today: '当日',
    week: '最近7天',
    month: '本月'
  };

  const formatXAxis = (tickItem: string) => {
    // Expected format: "2026-03-20 00:00"
    const parts = tickItem.split(' ');
    if (parts.length === 2) {
      const dateParts = parts[0].split('-');
      // Return e.g. "03-20" or just time if it's today
      if (timeRange === 'today') {
        return parts[1]; // just "00:00"
      }
      return `${dateParts[1]}-${dateParts[2]}`;
    }
    return tickItem;
  };

  const formatYAxisTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  // Custom tooltip for better appearance
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-slate-200 shadow-xl text-xs">
          <p className="font-semibold text-slate-700 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-slate-600">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span>{entry.name}:</span>
              <span className="font-medium">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full p-4 flex flex-col font-sans text-slate-800 bg-transparent">
      {/* Widget Container - More transparent to blend with desktop */}
      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 flex flex-col overflow-hidden relative">
        
        {/* Header (Draggable) */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white shadow-sm">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <Activity size={18} />
            <span className="text-sm">GLM Coding Plan</span>
          </div>
          <div className="flex items-center gap-1.5 no-drag">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all"
              title="设置"
            >
              <Settings size={15} />
            </button>
            <button 
              onClick={loadData}
              className={`p-1.5 hover:bg-white/20 rounded-lg transition-all ${loading ? 'animate-spin' : ''}`}
              title="刷新"
            >
              <RefreshCw size={15} />
            </button>
            <button 
              onClick={handleClose}
              className="p-1.5 hover:bg-red-500/80 rounded-lg transition-all"
              title="关闭"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content (Scrollable if needed, not draggable) */}
        <div className="flex-1 p-4 overflow-y-auto no-drag relative">
          
          {showSettings ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-200 bg-white/90 p-4 rounded-xl shadow-inner h-full">
              <h2 className="font-bold text-slate-700 mb-2">设置</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Base URL</label>
                <input 
                  type="text" 
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="https://open.bigmodel.cn"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Auth Token</label>
                <input 
                  type="password" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Bearer ..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">默认查询时间范围</label>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="w-full text-sm p-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="today">当日</option>
                  <option value="week">最近7天</option>
                  <option value="month">本月</option>
                </select>
              </div>
              <button 
                onClick={saveSettings}
                className="w-full py-2 mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Save size={16} />
                保存并应用
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Header Controls: Tabs + Filters */}
              <div className="flex flex-col gap-3">
                {/* Main Tabs */}
                <div className="flex bg-slate-100/50 p-1 rounded-lg w-full max-w-[200px]">
                  <button
                    onClick={() => setActiveTab('model')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                      activeTab === 'model' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                    }`}
                  >
                    模型用量
                  </button>
                  <button
                    onClick={() => setActiveTab('tool')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${
                      activeTab === 'tool' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
                    }`}
                  >
                    工具用量
                  </button>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-1.5">
                  {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-[11px] rounded-full border transition-all ${
                        timeRange === range 
                          ? 'border-blue-500 text-blue-600 bg-blue-50' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {timeRangeLabels[range]}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50/80 border border-red-100 rounded-xl text-xs text-red-600 leading-relaxed">
                  {error}
                </div>
              )}

              {/* Chart Section */}
              <div className="bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-xs text-slate-600">
                    {activeTab === 'model' ? 'TOKENS总量' : '工具调用总次数'}
                  </h3>
                  <div className="text-xl font-bold text-slate-800 tracking-tight">
                    {activeTab === 'model' 
                      ? data.modelUsage.toLocaleString() 
                      : data.toolUsage.toLocaleString()}
                  </div>
                </div>

                <div className="h-40 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={formatXAxis}
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                        dy={5}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={activeTab === 'model' ? formatYAxisTokens : undefined}
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                      
                      {activeTab === 'model' ? (
                        <Bar dataKey="tokens" name="Tokens" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={20} />
                      ) : (
                        <>
                          <Bar dataKey="webSearch" name="网页搜索" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={20} />
                          <Bar dataKey="webRead" name="网页读取" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} maxBarSize={20} />
                          <Bar dataKey="github" name="开源仓库" stackId="a" fill="#eab308" radius={[2, 2, 0, 0]} maxBarSize={20} />
                          <Bar dataKey="searchMcp" name="搜索 MCP" stackId="a" fill="#8b5cf6" radius={[2, 2, 0, 0]} maxBarSize={20} />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quota / Limit */}
              <div className="bg-gradient-to-br from-white/60 to-white/40 p-4 rounded-xl border border-white/50 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                    <Clock size={14} />
                  </div>
                  <h3 className="font-semibold text-xs">配额状态</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500">5小时内 Tokens 用量</span>
                      <span className="font-bold text-slate-700">{data.tokensPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${data.tokensPercentage > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`} 
                        style={{ width: `${Math.min(data.tokensPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500">本月 MCP 工具调用用量</span>
                      <span className="font-bold text-slate-700">{data.mcpPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${data.mcpPercentage > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-400 to-indigo-500'}`} 
                        style={{ width: `${Math.min(data.mcpPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
        
        {/* Footer */}
        {!showSettings && (
          <div className="px-4 py-2 bg-slate-50/50 border-t border-white/40 text-[10px] text-center text-slate-400 no-drag">
            最后更新: {lastUpdated}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
