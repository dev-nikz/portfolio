export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  const reply=(status,message)=>res.status(status).json({message});
  if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,'Use POST.');}
  try { if(req.headers.origin && new URL(req.headers.origin).host!==req.headers.host)return reply(403,'Invalid origin.'); } catch { return reply(403,'Invalid origin.'); }
  let data;try{data=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return reply(400,'Invalid submission.');}
  if(!data||JSON.stringify(data).length>12000)return reply(400,'Submission is too large.');
  if(data.website)return reply(200,'Thank you. Your enquiry has been received.');
  const clean=(key,max)=>typeof data[key]==='string'?data[key].trim().slice(0,max):'';
  const name=clean('name',120),email=clean('email',254),message=clean('message',5000),type=clean('type',20);
  if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email)||message.length<10||!['role','project'].includes(type))return reply(400,'Please complete your name, email, enquiry type, and a message of at least 10 characters.');
  if(!process.env.RESEND_API_KEY||!process.env.CONTACT_FROM_EMAIL)return reply(503,'Email delivery is not configured yet. Please email nikzdev@gmail.com directly.');
  try{
    const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.CONTACT_FROM_EMAIL,to:[process.env.CONTACT_TO_EMAIL||'nikzdev@gmail.com'],reply_to:email,subject:`Portfolio enquiry: ${type==='role'?'Role opportunity':'Project'}`,text:`Type: ${type}\nName: ${name}\nEmail: ${email}\nCompany: ${clean('company',160)}\nService / role: ${clean('service',160)}\nTimeline: ${clean('timeline',120)}\n\n${message}`}),signal:AbortSignal.timeout(10000)});
    if(!result.ok)return reply(502,'Your enquiry could not be sent. Please try again or email nikzdev@gmail.com.');
    return reply(200,'Thank you. Your enquiry has been sent. I’ll get back to you by email.');
  }catch{return reply(502,'Sending failed. Your message is still here. Please try again or email nikzdev@gmail.com.');}
}
