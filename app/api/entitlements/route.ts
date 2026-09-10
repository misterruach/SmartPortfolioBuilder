import {NextResponse} from 'next/server';import {PLANS} from '@/lib/plans';export function GET(){return NextResponse.json({plan:PLANS.find(p=>p.slug==='free'),source:'demo'})}
