export interface Application {
    host: string; 
    defaultEnv: string;
    gridViewPeriod: string; 
    kpiViewPeriod: string;
}

export class QueryParams {
    private _optional: {[key: string]: any} = {};

    constructor(public _period: Period, public _env: string, public _appname?: string[], public _hosts?: string[], public _rangestatus?: string[], public _commands?: string[], public _schemas?: string[]) {
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


    set appname(appname: string[]) {
       this._appname = appname;
    }

    get appname(): string[] {
        return this._appname;
    }

    set hosts(appname: string[]) {
        this._hosts = appname;
    }

    get hosts(): string[] {
        return this._hosts;
    }

    set rangestatus(rangestatus: string[]) {
        this._rangestatus = rangestatus;
    }

    get rangestatus(): string[] {
        return this._rangestatus;
    }


    set commands(command: string[]){
        this._commands = command
    }
    get commands(): string[] {
        return this._commands;
    }

    set schemas(schema: string[]){
        this._schemas = schema
    }
    get schemas(): string[] {
        return this._schemas;
    }


    get optional(): {[key: string]: any} {
        return this._optional;
    }

    set optional(optional: {[key: string]: any}) {
        this._optional = {};
        Object.entries(optional).forEach(([key, value]) => {
            if(value && value.length) this._optional[key] = value;
        })
    }

    buildParams(): { [key: string]: any } {
        let params = { ...this.period.buildParams(), ...this.optional };
        if(this.appname && this.appname.length > 0){
            params = { ...params, server: this.appname.length == 1 ? this.appname[0] : this.appname};
        }
        if(this.hosts && this.hosts.length > 0){
            params = { ...params, host: this.hosts.length == 1 ? this.hosts[0] : this.hosts};
        }
        if(this.rangestatus && this.rangestatus.length > 0){
            params = { ...params, rangestatus: this.rangestatus.length == 1 ? this.rangestatus[0] : this.rangestatus};
        }
        if(this.env) {
            params = { ...params, env: this.env };
        }
        if(this.commands && this.commands.length> 0){
            params = {...params, command: this.commands.toString()}
        }
        if(this.schemas && this.schemas.length> 0){
            params = {...params, schema: this.schemas.toString()}
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

export class IStepFrom  implements Period {

    constructor(public _step:number, public _from: number){

    }

    set start(start: Date) {
        console.warn("not implemented");
    }

    get start(): Date {
        let now = this.end;
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - this._step);
    }

    set end(end: Date) {
        console.warn("not implemented");
    }

    get end(): Date {
        let now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() - this._from, 0, 0);
    }

    buildParams(): { step: number, from: number  } {
        return { step: this._step, from: this._from};
    }
}

export interface Period {
    set start(value: Date);
    get start(): Date;

    set end(value: Date);
    get end(): Date;

    buildParams(): {[key: string]: any};
}