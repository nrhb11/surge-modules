const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function run(file,body,url='https://www.youtube.com/youtubei/v1/player',headers={}) {let result;vm.runInNewContext(fs.readFileSync(file,'utf8'),{$request:{url,headers},$response:{body:typeof body==='string'?body:JSON.stringify(body),headers:{}},$argument:'{}',$done:x=>result=x,console:{log(){}}},{timeout:1000});return result;}
const base=__dirname+'/../modules/streaming/youtube/scripts/';let tests=[];
const mixed=[{adPlacements:[{ad:'synthetic'}],streamingData:{formats:[{itag:18,url:'https://example.invalid/media'}]},playabilityStatus:{status:'OK'}}];
const shell=[{richItemRenderer:{},streamingData:{formats:[{itag:18}]},playabilityStatus:{status:'OK'}}];
const nested=[{richItemRenderer:{streamingData:{formats:[{itag:18}]},playabilityStatus:{status:'OK'}}}];
const unknown=[{richItemRenderer:{content:{text:'ordinary content'}}}];
const shellAd=[{richItemRenderer:{adSlotRenderer:{synthetic:true}}}];
const trackingAd=[{adSlotRenderer:{synthetic:true},trackingParams:'synthetic-metadata'}];
const pure=[{adSlotRenderer:{synthetic:true}},{videoRenderer:{videoId:'synthetic'}}];
for(const name of ['youtube-premium-like.js','youtube-home-response.js']){
 const evaluate=(file,obj)=>{if(name.includes('home')){const html='<script>var ytInitialData = '+JSON.stringify({contents:obj})+';</script>';const out=run(file,html,'https://www.youtube.com/');const changed=out.body||html;return JSON.parse(changed.slice(changed.indexOf(' = ')+3,changed.lastIndexOf(';</script>'))).contents;}return JSON.parse(run(file,obj).body);};
 for(const [label,fixture] of [['mixed-ad-and-player',mixed],['empty-shell-with-player-sibling',shell],['pure-ad-plus-normal',pure],['nested-player-inside-shell',nested],['unknown-normal-content-in-shell',unknown],['pure-ad-inside-shell',shellAd],['ad-with-tracking-metadata',trackingAd]]){
  const candidate=evaluate(base+name,fixture);
  if(label==='nested-player-inside-shell'||label==='unknown-normal-content-in-shell'){assert.deepEqual(candidate,fixture);}else if(label==='pure-ad-inside-shell'){assert.equal(candidate.length,0);}else if(label==='ad-with-tracking-metadata'){assert.deepEqual(candidate,[]);}else if(label==='pure-ad-plus-normal'){assert.equal(candidate.length,1);assert(candidate[0].videoRenderer);}else{assert.equal(candidate.length,1);assert(candidate[0].streamingData);assert(!candidate[0].adPlacements);}
  tests.push({script:name,test:label,candidate_array_length:candidate.length,pass:true});
 }
}
console.log('14 structure regressions passed');
