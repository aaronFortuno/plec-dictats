'use strict';
const format=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'});
function slot(log,now=Date.now()){
 if(!Array.isArray(log)||!Number.isFinite(now))throw Error('Registre o rellotge invàlid.');
 const times=log.map(r=>Date.parse(r.at));if(times.some(t=>!Number.isFinite(t)||t>now+1000))throw Error('El rellotge no concorda amb el registre de peticions.');
 const quotaDay=format.format(new Date(now)),requests=times.filter(t=>format.format(new Date(t))===quotaDay).length;
 return {quotaDay,requests,full:requests>=10,waitMs:Math.max(0,Math.max(...times,0)+120000-now)};
}
function recorded(item,record,receipt){
 if(!record&&!receipt)return false;
 if(!record||!receipt||record.requestHash!==item.requestHash||record.planHash!==item.planHash||receipt.requestHash!==item.requestHash||receipt.planHash!==item.planHash||receipt.rawSha256!==record.rawSha256||receipt.newSynthesisRequests!==1)throw Error('El registre o rebut publicat no correspon al lot aprovat. Cap petició nova.');
 return true;
}
module.exports={slot,recorded};
