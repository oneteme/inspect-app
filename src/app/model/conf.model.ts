export interface Application {
    default_env: string;
    session: Partial<Session>;
    dashboard: Partial<Dashboard>;
}

interface Session {
    api: Partial<Api>;
    main: Partial<Main>;
}

interface Main {
    default_period: Period;
}

interface Dashboard {
    default_period: Partial<Period>;
    home: Partial<Home>;
    api: Partial<Api>;
    app: Partial<App>;
    database: Partial<Database>;
    user: Partial<User>;
}

interface Api {
    default_period: Period;
}

interface App {
    default_period: Partial<Period>;
}

interface Database {
    default_period: Partial<Period>;
}

interface User {
    default_period: Partial<Period>;
}

interface Home{
    default_period: Partial<Period>;
}

export class QueryParams {
    constructor(public _period: Period, public _env: string, public _servers: string[]) {
    }

    set period(period: Period) {
        this._period = period;
    }

    get period(): Period {
        return this._period;
    }

    get env(): string {
        return this._env;
    }

    set servers(servers: string[]) {
       this._servers = servers;
    }

    get servers(): string[] {
        return this._servers;
    }

    buildParams(): { [key: string]: any } {
        let params = { ...this.period.buildParams() };
        if(this.servers && this.servers.length > 0){
            params = { ...params, server: this.servers.length == 1 ? this.servers[0] : this.servers};
        }
        if(this.env) {
            params = { ...params, env: this.env };
        }
        return params;
    }

    buildPath(): string {
        return Object.entries(this.buildParams()).map(v => {
            if(Array.isArray(v[1])) {
                if(v[1].length) return v[1].map(a => `${v[0]}=${a}`).join('&');
                else return null;
            }
            return `${v[0]}=${v[1]}`;
        }).filter(s => s != null).join('&');
    }
}

export class IPeriod implements Period {
    constructor(public _start: Date, public _end: Date) {
    }

    set start(start: Date) {
        this._start = start;
    }

    get start(): Date {
        return this._start;
    }

    set end(end: Date) {
        this._end = end;
    }

    get end(): Date {
        return this._end;
    }

    buildParams(): { start: string, end: string } {
        return { start: this.start.toISOString(), end: this.end.toISOString() };
    }
}

export class IStep implements Period {

    constructor(public _step: number) {
    }

    set start(start: Date) {
        console.warn("not implemented");
    }

    get start(): Date {
        let now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - this._step);
    }

    set end(end: Date) {
        console.warn("not implemented");
    }

    get end(): Date {
        let now = new Date();
        now.setSeconds(0, 0);
        return now;
    }

    buildParams(): { step: number } {
        return { step: this._step };
    }
}

export interface Period {
    set start(value: Date);
    get start(): Date;

    set end(value: Date);
    get end(): Date;

    buildParams(): {[key: string]: any};
}