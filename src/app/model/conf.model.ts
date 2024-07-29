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
    default_period: Partial<DefaultPeriod>;
}

interface Dashboard {
    default_period: Partial<DefaultPeriod>;
    api: Partial<Api>;
    app: Partial<App>;
    database: Partial<Database>;
    user: Partial<User>;
}

interface Api {
    default_period: Partial<DefaultPeriod>;
}

interface App {
    default_period: Partial<DefaultPeriod>;
}

interface Database {
    default_period: Partial<DefaultPeriod>;
}

interface User {
    default_period: Partial<DefaultPeriod>;
}

interface DefaultPeriod {
    start: Date;
    end: Date;
}