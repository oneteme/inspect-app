import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { app, environment } from './environments/environment';
import { ApplicationNew } from './app/model/conf.model';

if (environment.production) {
  enableProdMode();
}

const HOST_PATTERN = /https?:\/\/[\w\-.]+(:\d{2,5})?\/?/;
const PERIOD_PATTERN = /LAST_(\d+)(_\d+)?/;
const ENV_PATTERN = /[\w-]/;

function loadConfig(){
  return fetch('assets/environment.remote.json')
  .then(res => res.json())
  .then((resp: ApplicationNew) =>{
      matchRegex(resp.host, "host", HOST_PATTERN,) || delete resp.host;
      matchRegex(resp.defaultEnv, "defaultEnv",ENV_PATTERN) || delete resp.defaultEnv;
      matchRegex(resp.gridViewPeriod, "gridViewPeriod", PERIOD_PATTERN) || delete resp.gridViewPeriod;
      matchRegex(resp.kpiViewPeriod, "kpiViewPeriod", PERIOD_PATTERN) || delete resp.kpiViewPeriod;
      return resp;
    })
  .catch((err)=> {
    console.warn(`Error while loading config`);
    return {};
  })
  
}


 function matchRegex(v: string,  name: string, pattern: RegExp) {
  if(v && pattern.exec(v)){
     return true;
  }else {
    console.warn(`bad value ${name}=${v}, pattern=${pattern}. Default value will be used: ${app[name]}`);
  }
  return false;
}



  loadConfig()
  .then((resp)=>{ 
    Object.assign(app,resp);
    console.info(`Loaded config: ${JSON.stringify(app)}`)
    platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err)) 
  });