export interface ChartDataPoint {
  time: string;
  tokens?: number;
  webSearch?: number;
  webRead?: number;
  github?: number;
  searchMcp?: number;
}

export interface UsageData {
  modelUsage: number;
  toolUsage: number;
  tokensPercentage: number;
  mcpPercentage: number;
  chartData: ChartDataPoint[];
}

export type TimeRange = 'today' | 'week' | 'month';

export const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getTimeRangeDates = (range: TimeRange) => {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (range === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  } else {
    // month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  return { startTime: formatDateTime(start), endTime: formatDateTime(end) };
};

export const fetchUsageData = async (baseUrl: string, token: string, range: TimeRange): Promise<UsageData> => {
  const { startTime, endTime } = getTimeRangeDates(range);
  const queryParams = `?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
  
  const headers = {
    'Authorization': token,
    'Accept-Language': 'zh-CN,zh',
    'Content-Type': 'application/json'
  };

  const domain = baseUrl.replace(/\/$/, '');

  const fetchProxy = async (url: string, opts: any) => {
    if (window.electron && window.electron.fetchApi) {
      const res = await window.electron.fetchApi(url, opts);
      if (!res.ok) throw new Error(res.error || `HTTP Error ${res.status}`);
      return res.data;
    } else {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    }
  };

  try {
    const [modelJson, toolJson, limitJson] = await Promise.all([
      fetchProxy(`${domain}/api/monitor/usage/model-usage${queryParams}`, { headers }),
      fetchProxy(`${domain}/api/monitor/usage/tool-usage${queryParams}`, { headers }),
      fetchProxy(`${domain}/api/monitor/usage/quota/limit`, { headers })
    ]);

    // Parse model usage from the specific JSON structure provided by the user
    const modelUsage = modelJson.data?.totalUsage?.totalTokensUsage || 0;
    
    // Parse tool usage by summing up the different tool counts
    const toolTotalUsage = toolJson.data?.totalUsage || {};
    const toolUsage = (toolTotalUsage.totalNetworkSearchCount || 0) + 
                      (toolTotalUsage.totalWebReadMcpCount || 0) + 
                      (toolTotalUsage.totalZreadMcpCount || 0) + 
                      (toolTotalUsage.totalSearchMcpCount || 0);

    let tokensPercentage = 0;
    let mcpPercentage = 0;

    if (limitJson.data && limitJson.data.limits) {
      limitJson.data.limits.forEach((item: any) => {
        if (item.type === 'TOKENS_LIMIT') {
          tokensPercentage = item.percentage || 0;
        } else if (item.type === 'TIME_LIMIT') {
          mcpPercentage = item.percentage || 0;
        }
      });
    }

    // Build chart data
    const chartData: ChartDataPoint[] = [];
    const modelTimeAxis = modelJson.data?.x_time || [];
    const toolTimeAxis = toolJson.data?.x_time || [];
    
    // We assume model and tool have similar time axes, use the longer one or merge
    const timeSet = new Set<string>([...modelTimeAxis, ...toolTimeAxis]);
    const sortedTimes = Array.from(timeSet).sort();

    const modelTokensArray = modelJson.data?.tokensUsage || [];
    const webSearchArray = toolJson.data?.networkSearchCount || [];
    const webReadArray = toolJson.data?.webReadMcpCount || [];
    const githubArray = toolJson.data?.zreadMcpCount || [];
    const searchMcpArray = toolJson.data?.searchMcpCount || []; // Guessing the key based on others

    sortedTimes.forEach((time) => {
      const modelIdx = modelTimeAxis.indexOf(time);
      const toolIdx = toolTimeAxis.indexOf(time);

      chartData.push({
        time: time,
        tokens: modelIdx !== -1 ? (modelTokensArray[modelIdx] || 0) : 0,
        webSearch: toolIdx !== -1 ? (webSearchArray[toolIdx] || 0) : 0,
        webRead: toolIdx !== -1 ? (webReadArray[toolIdx] || 0) : 0,
        github: toolIdx !== -1 ? (githubArray[toolIdx] || 0) : 0,
        searchMcp: toolIdx !== -1 ? (searchMcpArray[toolIdx] || 0) : 0,
      });
    });

    return {
      modelUsage,
      toolUsage,
      tokensPercentage,
      mcpPercentage,
      chartData
    };
  } catch (error) {
    console.error('Failed to fetch usage data:', error);
    throw error;
  }
};
