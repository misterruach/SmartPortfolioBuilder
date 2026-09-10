import { getServerSupabase } from './supabase/server';
export async function getEntitlements(userId:string){
 const supabase=await getServerSupabase();
 const {data}=await supabase.from('user_plans').select('*, plans(*)').eq('user_id',userId).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle();
 const plan:any=data?.plans || {slug:'free',project_limit:1,template_limit:10,ai_action_limit:10,portfolio_duration_days:7};
 return {plan,projectsUsed:data?.projects_used??0,aiActionsUsed:data?.ai_actions_used??0,projectsRemaining:Math.max(0,(plan.project_limit??1)-(data?.projects_used??0)),aiActionsRemaining:Math.max(0,(plan.ai_action_limit??10)-(data?.ai_actions_used??0))};
}
