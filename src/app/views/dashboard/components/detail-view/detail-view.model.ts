export interface DashboardDetailContext {
    selectedInsights: Set<string>;
    protocolDefs: any[];
    topErrors: Record<string, { type: string; count: number }[]>;
    kpiLoading: boolean;
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
    chartRequests: Record<string, any>;
    sparklinePercs: Record<string, number>;
    sparklineTitles: Record<string, { title: string; subtitle: string }>;
}
