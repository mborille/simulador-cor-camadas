var fs=require('fs'); eval(fs.readFileSync('modelo.js','utf8')+';global.X={layerFromLab,applyLayer,simulate,tp,calibrate,dE00,labOfLin,lab2lin,lin2lab,kmLayer,lab2rgb8};');
var Q=global.X; var ok=true; function chk(n,c,d){console.log((c?'OK  ':'FAIL')+' '+n+(d?' '+d:'')); if(!c) ok=false;}
// 1. limites
chk('x=0 devolve fundo', Math.abs(Q.kmLayer(0.6,5,0,0.3)-0.3)<1e-12);
chk('x grande devolve rinf', Math.abs(Q.kmLayer(0.6,5,50,0.1)-0.6)<1e-6);
chk('fundo=rinf permanece', Math.abs(Q.kmLayer(0.6,5,0.7,0.6)-0.6)<1e-9);
// 2. ida e volta Lab
var l=Q.lin2lab.apply(null,Q.lab2lin(77,0.5,14)); chk('Lab ida e volta', Math.abs(l[0]-77)<1e-4&&Math.abs(l[2]-14)<1e-4);
// 3. calibração: simula camada conhecida e recupera
var lay=Q.layerFromLab([77,0.5,14],[3.0,3.2,3.6]); var x0=1.0;
var wl=Q.lab2lin(93,0,0), rw=Q.applyLayer(lay,x0,wl), rb=Q.applyLayer(lay,x0,[0.0005,0.0005,0.0005]);
var cal=Q.calibrate(Q.labOfLin(rb),Q.labOfLin(rw),x0,93);
chk('calibração recupera S', cal.S.every(function(s,i){return Math.abs(s-lay.S[i])/lay.S[i]<0.03;}), JSON.stringify(cal.S.map(function(v){return +v.toFixed(2)})));
chk('calibração recupera rinf', cal.rinf.every(function(s,i){return Math.abs(s-lay.rinf[i])/lay.rinf[i]<0.03;}));
// 4. monotonia: mais espessura sobre substrato escuro aproxima cor própria
var base=Q.layerFromLab([77,0.5,14],3.0), prev=null, mono=true;
for(var x=0.1;x<=2;x+=0.1){var s=Q.simulate({sub:[48,4,14],cemLab:[78,0,10],cemS:3,cemX:0.1,ceramic:base,cerX:x}); var d=Q.dE00(s.finLab,[77,0.5,14]); if(prev!==null&&d>prev+1e-9) mono=false; prev=d;}
chk('ΔE ao alvo cai com a espessura (substrato escuro)', mono);
// 5. cerâmica mais translúcida mostra mais o substrato
var L=[]; [1.0,3.0,8.0].forEach(function(S){var s=Q.simulate({sub:[48,4,14],cemLab:[78,0,10],cemS:3,cemX:0.1,ceramic:Q.layerFromLab([77,0.5,14],S),cerX:0.5}); L.push(s.finLab[0]);});
chk('maior S, mais L (mais opaca, mais clara)', L[0]<L[1]&&L[1]<L[2], L.map(function(v){return v.toFixed(1)}).join(' < '));
// 6. TP em 1 mm por S
[0.8,1.0,1.5,2.0,2.5,3.0,4.0,6.0].forEach(function(S){console.log('S',S,'TP1mm',Q.tp(Q.layerFromLab([77,0.5,14],S),1.0,93).toFixed(1));});
process.exit(ok?0:1);
