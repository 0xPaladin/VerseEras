// https://github.com/Fil/d3-geo-voronoi v2.0.1 Copyright 2021 Philippe Rivière
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports,require("d3-delaunay"),require("d3-geo"),require("d3-array"),require("d3-tricontour")):"function"==typeof define&&define.amd?define(["exports","d3-delaunay","d3-geo","d3-array","d3-tricontour"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).d3=e.d3||{},e.d3,e.d3,e.d3,e.d3)}(this,(function(e,t,n,o,r){"use strict";const i=Math.PI,u=i/2,a=180/i,s=i/180,l=Math.atan2,c=Math.cos,f=Math.max,p=Math.min,d=Math.sin,h=Math.sign||function(e){return e>0?1:e<0?-1:0},g=Math.sqrt;function y(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function m(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function v(e,t){return[e[0]+t[0],e[1]+t[1],e[2]+t[2]]}function _(e){var t=g(e[0]*e[0]+e[1]*e[1]+e[2]*e[2]);return[e[0]/t,e[1]/t,e[2]/t]}function M(e){return[l(e[1],e[0])*a,(t=f(-1,p(1,e[2])),(t>1?u:t<-1?-u:Math.asin(t))*a)];var t}function b(e){const t=e[0]*s,n=e[1]*s,o=c(n);return[o*c(t),o*d(t),d(n)]}function j(e){return y((e=e.map((e=>b(e))))[0],m(e[2],e[1]))}function E(e){const r=function(e){if(e.length<2)return{};let o=0;for(;isNaN(e[o][0]+e[o][1])&&o++<e.length;);const r=n.geoRotation(e[o]),i=n.geoStereographic().translate([0,0]).scale(1).rotate(r.invert([180,0]));e=e.map(i);const u=[];let a=1;for(let t=0,n=e.length;t<n;t++){let n=e[t][0]**2+e[t][1]**2;!isFinite(n)||n>1e32?u.push(t):n>a&&(a=n)}const s=1e6*g(a);u.forEach((t=>e[t]=[s,0])),e.push([0,s]),e.push([-s,0]),e.push([0,-s]);const l=t.Delaunay.from(e);l.projection=i;const{triangles:c,halfedges:f,inedges:p}=l;for(let t=0,n=f.length;t<n;t++)if(f[t]<0){const e=t%3==2?t-2:t+1,n=t%3==0?t+2:t-1,r=f[e],i=f[n];f[r]=i,f[i]=r,f[e]=f[n]=-1,c[t]=c[e]=c[n]=o,p[c[r]]=r%3==0?r+2:r-1,p[c[i]]=i%3==0?i+2:i-1,t+=2-t%3}else c[t]>e.length-3-1&&(c[t]=o);return l}(e),i=function(e){const{triangles:t}=e;if(!t)return[];const n=[];for(let e=0,o=t.length/3;e<o;e++){const o=t[3*e],r=t[3*e+1],i=t[3*e+2];o!==r&&r!==i&&n.push([o,i,r])}return n}(r),u=function(e,t){const n=new Set;return 2===t.length?[[0,1]]:(e.forEach((e=>{if(e[0]!==e[1]&&!(j(e.map((e=>t[e])))<0))for(let t,r=0;r<3;r++)t=(r+1)%3,n.add(o.extent([e[r],e[t]]).join("-"))})),Array.from(n,(e=>e.split("-").map(Number))))}(i,e),a=function(e,t){const n=[];e.forEach((e=>{for(let t=0;t<3;t++){const o=e[t],r=e[(t+1)%3];n[o]=n[o]||[],n[o].push(r)}})),0===e.length&&(2===t?(n[0]=[1],n[1]=[0]):1===t&&(n[0]=[]));return n}(i,e.length),s=function(e,t){function n(e,t){let n=e[0]-t[0],o=e[1]-t[1],r=e[2]-t[2];return n*n+o*o+r*r}return function(o,r,i){void 0===i&&(i=0);let u,a,s=i;const l=b([o,r]);do{u=i,i=null,a=n(l,b(t[u])),e[u].forEach((e=>{let o=n(l,b(t[e]));if(o<a)return a=o,i=e,void(s=e)}))}while(null!==i);return s}}(a,e),l=function(e,t){return e.map((e=>{const n=e.map((e=>t[e])).map(b);return M(_(v(v(m(n[1],n[0]),m(n[2],n[1])),m(n[0],n[2]))))}))}(i,e),{polygons:c,centers:f}=function(e,t,n){const o=[],r=e.slice();if(0===t.length){if(n.length<2)return{polygons:o,centers:r};if(2===n.length){const e=b(n[0]),t=b(n[1]),u=_(v(e,t)),a=_(m(e,t)),s=m(u,a),l=[u,m(u,s),m(m(u,s),s),m(m(m(u,s),s),s)].map(M).map(i);return o.push(l),o.push(l.slice().reverse()),{polygons:o,centers:r}}}t.forEach(((e,t)=>{for(let n=0;n<3;n++){const r=e[n],i=e[(n+1)%3],u=e[(n+2)%3];o[r]=o[r]||[],o[r].push([i,u,t,[r,i,u]])}}));function i(e){let n=-1;return r.slice(t.length,1/0).forEach(((o,r)=>{o[0]===e[0]&&o[1]===e[1]&&(n=r+t.length)})),n<0&&(n=r.length,r.push(e)),n}return{polygons:o.map((e=>{const t=[e[0][2]];let o=e[0][1];for(let n=1;n<e.length;n++)for(let n=0;n<e.length;n++)if(e[n][0]==o){o=e[n][1],t.push(e[n][2]);break}if(t.length>2)return t;if(2==t.length){const o=x(n[e[0][3][0]],n[e[0][3][1]],r[t[0]]),u=x(n[e[0][3][2]],n[e[0][3][0]],r[t[0]]),a=i(o),s=i(u);return[t[0],s,t[1],a]}})),centers:r}}(l,i,e),p=function(e){const t=[];return e.forEach((e=>{if(!e)return;let n=e[e.length-1];for(let o of e)o>n&&t.push([n,o]),n=o})),t}(c),d=function(e,t){const n=new Set,o=[];e.map((e=>{if(!(j(e.map((e=>t[e>t.length?0:e])))>1e-12))for(let t=0;t<3;t++){let o=[e[t],e[(t+1)%3]],r=`${o[0]}-${o[1]}`;n.has(r)?n.delete(r):n.add(`${o[1]}-${o[0]}`)}}));const r=new Map;let i;if(n.forEach((e=>{e=e.split("-").map(Number),r.set(e[0],e[1]),i=e[0]})),void 0===i)return o;let u=i;do{o.push(u);let e=r.get(u);r.set(u,-1),u=e}while(u>-1&&u!==i);return o}(i,e),h=function(e,t){return function(n){const r=new Map,i=new Map;return e.forEach(((e,t)=>{const o=e.join("-");r.set(o,n[t]),i.set(o,!0)})),t.forEach((e=>{let t=0,n=-1;for(let i=0;i<3;i++){let u=o.extent([e[i],e[(i+1)%3]]).join("-");r.get(u)>t&&(t=r.get(u),n=u)}i.set(n,!1)})),e.map((e=>i.get(e.join("-"))))}}(u,i);return{delaunay:r,edges:u,triangles:i,centers:f,neighbors:a,polygons:c,mesh:p,hull:d,urquhart:h,find:s}}function x(e,t,n){e=b(e),t=b(t),n=b(n);const o=h(y(m(t,e),n));return M(_(v(e,t)).map((e=>o*e)))}e.geoContour=function(){let e;return r.tricontour().triangulate(((t,n,o)=>(e=E(t.map((e=>[n(e),o(e)]))),e.delaunay))).pointInterpolate(((t,o,r)=>{const{points:i,projection:u}=e.delaunay,a=u.invert([i[2*t],i[2*t+1]]),s=u.invert([i[2*o],i[2*o+1]]);return n.geoInterpolate(a,s)(r)})).ringsort((e=>(e.length&&!e[0].reversed&&(e.forEach((e=>e.reverse())),e[0].reversed=!0),[e])))},e.geoDelaunay=E,e.geoVoronoi=function(e){const t=function(e){if(t.delaunay=null,t._data=e,"object"==typeof t._data&&"FeatureCollection"===t._data.type&&(t._data=t._data.features),"object"==typeof t._data){const e=t._data.map((e=>[t._vx(e),t._vy(e),e])).filter((e=>isFinite(e[0]+e[1])));t.points=e.map((e=>[e[0],e[1]])),t.valid=e.map((e=>e[2])),t.delaunay=E(t.points)}return t};return t._vx=function(e){return"object"==typeof e&&"type"in e?n.geoCentroid(e)[0]:0 in e?e[0]:void 0},t._vy=function(e){return"object"==typeof e&&"type"in e?n.geoCentroid(e)[1]:1 in e?e[1]:void 0},t.x=function(e){return e?(t._vx=e,t):t._vx},t.y=function(e){return e?(t._vy=e,t):t._vy},t.polygons=function(e){if(void 0!==e&&t(e),!t.delaunay)return!1;const n={type:"FeatureCollection",features:[]};return 0===t.valid.length||(t.delaunay.polygons.forEach(((e,o)=>n.features.push({type:"Feature",geometry:e?{type:"Polygon",coordinates:[[...e,e[0]].map((e=>t.delaunay.centers[e]))]}:null,properties:{site:t.valid[o],sitecoordinates:t.points[o],neighbours:t.delaunay.neighbors[o]}}))),1===t.valid.length&&n.features.push({type:"Feature",geometry:{type:"Sphere"},properties:{site:t.valid[0],sitecoordinates:t.points[0],neighbours:[]}})),n},t.triangles=function(e){return void 0!==e&&t(e),!!t.delaunay&&{type:"FeatureCollection",features:t.delaunay.triangles.map(((e,n)=>((e=e.map((e=>t.points[e]))).center=t.delaunay.centers[n],e))).filter((e=>j(e)>0)).map((e=>({type:"Feature",properties:{circumcenter:e.center},geometry:{type:"Polygon",coordinates:[[...e,e[0]]]}})))}},t.links=function(e){if(void 0!==e&&t(e),!t.delaunay)return!1;const o=t.delaunay.edges.map((e=>n.geoDistance(t.points[e[0]],t.points[e[1]]))),r=t.delaunay.urquhart(o);return{type:"FeatureCollection",features:t.delaunay.edges.map(((e,n)=>({type:"Feature",properties:{source:t.valid[e[0]],target:t.valid[e[1]],length:o[n],urquhart:!!r[n]},geometry:{type:"LineString",coordinates:[t.points[e[0]],t.points[e[1]]]}})))}},t.mesh=function(e){return void 0!==e&&t(e),!!t.delaunay&&{type:"MultiLineString",coordinates:t.delaunay.edges.map((e=>[t.points[e[0]],t.points[e[1]]]))}},t.cellMesh=function(e){if(void 0!==e&&t(e),!t.delaunay)return!1;const{centers:n,polygons:o}=t.delaunay,r=[];for(const e of o)if(e)for(let t=e.length,o=e[t-1],i=e[0],u=0;u<t;o=i,i=e[++u])i>o&&r.push([n[o],n[i]]);return{type:"MultiLineString",coordinates:r}},t._found=void 0,t.find=function(e,o,r){if(t._found=t.delaunay.find(e,o,t._found),!r||n.geoDistance([e,o],t.points[t._found])<r)return t._found},t.hull=function(e){void 0!==e&&t(e);const n=t.delaunay.hull,o=t.points;return 0===n.length?null:{type:"Polygon",coordinates:[[...n.map((e=>o[e])),o[n[0]]]]}},e?t(e):t},Object.defineProperty(e,"__esModule",{value:!0})}));