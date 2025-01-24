import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { app, environment } from './environments/environment';
import { ApplicationNew } from './app/model/conf.model';

if (environment.production) {
  enableProdMode();
}

// move this code maybe 
const HOST_PATTERN = /https?:\/\/[\w\-.]+(:\d{2,5})?\/?/;
const PERIOD_PATTERN = /LAST_(\d+)(_\d+)?/;
function loadConfig(){
  return fetch('assets/environement.remote.json')
            .then(res => res.json())
            .then((resp: ApplicationNew) =>{
                matchRegex(resp.host, "host", HOST_PATTERN,);
                validate(resp.defaultEnv, "defaultEnv");
                matchRegex(resp.gridViewPeriod, "gridViewPeriod", PERIOD_PATTERN);
                matchRegex(resp.kpiViewPeriod, "kpiViewPeriod", PERIOD_PATTERN);
                console.info(`initialized app config: ${JSON.stringify(app)}`)
              })
            .catch((err)=> {
              console.warn(`Error while loading config, Default config will be used: ${JSON.stringify(app)}`);
              throw err;
            })
  
}


function validate(v: string, name:string){
  if(v){
    app[name]= v 
  }else {
    console.warn(`bad value ${name}=${v}. Default value will be used: ${app[name]}`);
  }
}

 function matchRegex(v: string,  name: string, pattern: RegExp) {
  if(v && pattern.exec(v)){
     app[name] = v;
  }else {
    console.warn(`bad value ${name}=${v}, pattern=${pattern}. Default value will be used: ${app[name]}`);
  }
  
}



loadConfig().then(()=>platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err)));

  
