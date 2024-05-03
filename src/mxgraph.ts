// src/mxgraph.ts
//@ts-ignore
import factory from 'mxgraph';


declare global {
  interface Window {
    mxBasePath: string;
    mxLoadResources: boolean;
    mxForceIncludes: boolean;
    mxLoadStylesheets: boolean;
    mxResourceExtension: string;
  }
}

window.mxBasePath = '../../assets/mxgraph';
window.mxLoadResources = false;
window.mxForceIncludes = false;
window.mxLoadStylesheets = true;
window.mxResourceExtension = '.txt';

export default factory.call(window, {
  // not working see https://github.com/jgraph/mxgraph/issues/479
  mxBasePath: '../../assets/mxgraph',
});