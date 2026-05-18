export interface DashboardDetailContext {
    selectedInsights: Set<string>;
    protocolDefs: any[];
    topErrors: Record<string, { type: string; count: number }[]>;
    kpiLoading: boolean;
    serverHealthLoading: boolean;
    tabRequests: Record<string, any>;
    topSessionErrors: any[];
    topBatchErrors: any[];
    topViewErrors: any[];
    topStartupErrors: { type: string; count: number }[];
    sessionExceptionChart: { stringDate: string; count: number; perc: number }[];
    batchExceptionChart: { stringDate: string; count: number; perc: number }[];
    viewExceptionChart: { stringDate: string; count: number; perc: number }[];
    startupExceptionChart: { stringDate: string; count: number; perc: number }[];
    sessExcLineConfig: any;
    sessionCountLoading: boolean;
    sessionInitErrors: number;
    sessionWebErrors: number;
    sessionTestErrors: number;
    insightsAllClear: boolean;
    divergentBranches: { branch: string; count: number; servers: string[] }[];
    chartRequests: Record<string, any>;
    sparklinePercs: Record<string, number>;
    sparklineTitles: Record<string, { title: string; subtitle: string }>;
}
