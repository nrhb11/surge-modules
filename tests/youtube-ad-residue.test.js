const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=__dirname+'/../modules/streaming/youtube/scripts/';
let processHideShorts=false;
function process(name,input){let result;let body=JSON.stringify({contents:input});const home=name.includes('home');if(home)body='<script>var ytInitialData = '+body+';</script>';vm.runInNewContext(fs.readFileSync(root+name,'utf8'),{$request:{url:'https://www.youtube.com/youtubei/v1/browse'},$response:{body,headers:{}},$argument:JSON.stringify({hideShorts:processHideShorts}),$done:r=>result=r,console:{log(){}}},{timeout:1000});body=result.body||body;if(home)body=body.slice(body.indexOf(' = ')+3,body.lastIndexOf(';</script>'));return JSON.parse(body).contents;}
const tests=[
 ['nested ad shell with tracking',[{richItemRenderer:{content:{adSlotRenderer:{}},trackingParams:'synthetic'}}],[]],
 ['ad plus tracking',[{adSlotRenderer:{},trackingParams:'synthetic'}],[]],
 ['ad wrapper with logging',[{richItemRenderer:{content:{adSlotRenderer:{}},loggingDirectives:{synthetic:true}}}],[]],
 ['normal video survives',[{richItemRenderer:{content:{videoRenderer:{videoId:'normal'}},trackingParams:'synthetic'}}],null],
 ['nested media survives',[{richItemRenderer:{adPlacements:[{}],streamingData:{formats:[{itag:18}]}}}],[{richItemRenderer:{streamingData:{formats:[{itag:18}]}}}]],
 ['mixed ad and normal child',[{richItemRenderer:{content:{adSlotRenderer:{},videoRenderer:{videoId:'normal'}}}}],[{richItemRenderer:{content:{videoRenderer:{videoId:'normal'}}}}]],
 ['unknown sibling survives',[{richItemRenderer:{content:{adSlotRenderer:{}},futureData:{ordinary:true}}}],[{richItemRenderer:{content:{},futureData:{ordinary:true}}}]],
 ['metadata without ad provenance survives',[{trackingParams:'synthetic'}],null],
 ['empty content without ad provenance survives',[{richItemRenderer:{content:{},trackingParams:'synthetic'}}],null],
 ['non-ad nested empty shell does not give ad provenance',[{richItemRenderer:{content:{items:[{richItemRenderer:{}}]},trackingParams:'ordinary'}}],[{richItemRenderer:{content:{items:[]},trackingParams:'ordinary'}}]],
 ['normal item compacts to first slot',[{richItemRenderer:{content:{adSlotRenderer:{}},trackingParams:'ad'}},{richItemRenderer:{content:{videoRenderer:{videoId:'normal'}}}}],[{richItemRenderer:{content:{videoRenderer:{videoId:'normal'}}}}]]
];
for(const name of ['youtube-premium-like.js','youtube-home-response.js'])for(const [label,input,expected] of tests){assert.deepEqual(process(name,input),expected||input,name+': '+label);}
processHideShorts=true;
for(const name of ['youtube-premium-like.js','youtube-home-response.js']){
 const input=[{richItemRenderer:{content:{items:[{shortsShelfRenderer:{synthetic:true}}]},trackingParams:'ordinary'}}];
 assert.deepEqual(process(name,input),[{richItemRenderer:{content:{items:[]},trackingParams:'ordinary'}}],name+': Shorts cleanup is not ad provenance');
}
console.log('24 ad-residue and non-ad preservation regressions passed');
