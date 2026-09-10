export const PLANS=[
{name:'Free',slug:'free',price:0,projects:1,templates:10,ai:10,hosting:'7 days'},
{name:'Starter',slug:'starter',price:19,projects:2,templates:25,ai:50,hosting:'6 months'},
{name:'Plus',slug:'plus',price:49,projects:4,templates:50,ai:150,hosting:'1 year',featured:true},
{name:'Pro',slug:'pro',price:99,projects:6,templates:75,ai:350,hosting:'2 years'},
{name:'Business',slug:'business',price:249,projects:10,templates:100,ai:750,hosting:'3 years'}] as const;
export type PlanSlug=typeof PLANS[number]['slug'];
