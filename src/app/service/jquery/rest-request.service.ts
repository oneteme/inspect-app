import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {RestSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {RestRequestDto} from "../../model/request.model";


@Injectable({ providedIn: 'root' })
export class RestRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getRestRequest<T>(params?: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<RestRequestDto>> {
        return this.http.get<Array<RestRequestDto>>(`${this.server}/request/rest`, { params: params });
    }

    getRequestById(id: string): Observable<RestRequestDto> {
        return this.http.get<RestRequestDto>(`${this.server}/request/rest/${id}`);
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getRestExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getRestRequest(args);
    }

    getCountByDate(filters: {env: string, start: Date, end: Date, appName: string, groupedBy: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, countUnavailableServer: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, date: number, year: number}[]> {
        return this.getRestRequest({
            'column': `count:count,count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_unavailable_server:countUnavailableServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,start.${filters.groupedBy}:date,start.year:year`,
            'parent': 'main_session.id',
            'main_session.instance_env': 'instance.id',
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'order': 'year.asc,date.asc'
        });
    }

}