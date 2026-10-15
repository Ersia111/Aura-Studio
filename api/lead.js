// Vercel serverless endpoint. Configure RESEND_API_KEY, LEAD_TO_EMAIL,
// and LEAD_FROM_EMAIL as private environment variables in your hosting dashboard.
module.exports = async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{
  const {type,fields}=req.body||{};
  if(!['brand','consultation'].includes(type)||!fields||typeof fields!=='object')return res.status(400).json({error:'Invalid request'});
  const allowed=type==='brand'?['business','website','email','goal','budget','challenge']:['service','name','email','brief'];
  if(type==='brand'&&!fields.consent)return res.status(400).json({error:'Consent required'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fields.email||'')))return res.status(400).json({error:'Invalid email'});
  const required=type==='brand'?['business','website','email','goal']:['service','name','email','brief'];
  if(required.some(k=>!String(fields[k]||'').trim()))return res.status(400).json({error:'Missing fields'});
  const lines=allowed.map(k=>`${k}: ${String(fields[k]||'').slice(0,1500)}`);
  if(!process.env.RESEND_API_KEY||!process.env.LEAD_TO_EMAIL||!process.env.LEAD_FROM_EMAIL)return res.status(503).json({error:'Email service not configured'});
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({from:process.env.LEAD_FROM_EMAIL,to:[process.env.LEAD_TO_EMAIL],subject:type==='brand'?'AURA | Free Brand Check':'AURA | Proposal Request',text:lines.join('\n'),reply_to:String(fields.email)})
  });
  if(!response.ok)return res.status(502).json({error:'Email delivery failed'});
  return res.status(200).json({ok:true});
 }catch(e){return res.status(500).json({error:'Unexpected server error'});}
};
