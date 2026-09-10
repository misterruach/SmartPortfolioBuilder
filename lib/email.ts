export async function sendEmail(to:string,subject:string,html:string){
 if(!process.env.RESEND_API_KEY) return {skipped:true};
 const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM||'Smart Portfolio Builder <onboarding@resend.dev>',to:[to],subject,html})});
 if(!res.ok) throw new Error(`Email failed: ${await res.text()}`); return res.json();
}
