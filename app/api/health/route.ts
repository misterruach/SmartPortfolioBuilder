import {NextResponse} from 'next/server'; export async function GET(){return NextResponse.json({ok:true,app:'Smart Portfolio Builder',time:new Date().toISOString()});}
