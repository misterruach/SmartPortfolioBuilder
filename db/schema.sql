create extension if not exists pgcrypto;

create table if not exists public.plans(
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text,
 price numeric(10,2) default 0, currency text default 'USD', project_limit int not null, template_limit int not null,
 ai_action_limit int not null, portfolio_duration_days int, advanced_ats boolean default false, job_matching boolean default false,
 cover_letters boolean default false, analytics_level text default 'none', seo_level text default 'none', custom_domain boolean default false,
 remove_branding boolean default false, priority_support boolean default false, is_active boolean default true, is_featured boolean default false,
 sort_order int default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade, email text, name text, avatar_url text,
 role text default 'user' check(role in ('user','admin','super_admin','support','editor','finance')), status text default 'active',
 created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.user_plans(
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, plan_id uuid references public.plans(id),
 status text default 'active', started_at timestamptz default now(), expires_at timestamptz, projects_granted int default 1, projects_used int default 0,
 ai_actions_granted int default 10, ai_actions_used int default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.project_credits(
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, source text not null,
 amount int not null, remaining int not null, expires_at timestamptz, created_at timestamptz default now());
create table if not exists public.templates(
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, type text not null check(type in ('portfolio','resume')),
 category text, preview_image text, thumbnail text, template_data jsonb default '{}'::jsonb, is_free boolean default false,
 is_published boolean default true, is_featured boolean default false, required_template_tier text default 'free', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.projects(
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, type text not null check(type in ('portfolio','resume')),
 title text not null, slug text unique not null, template_id uuid references public.templates(id), status text default 'draft' check(status in ('draft','published','expired','archived','deleted')),
 content jsonb default '{}'::jsonb, settings jsonb default '{}'::jsonb, published_at timestamptz, expires_at timestamptz, views bigint default 0,
 created_at timestamptz default now(), updated_at timestamptz default now(), deleted_at timestamptz);
create table if not exists public.ai_usage(
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, project_id uuid references public.projects(id) on delete set null,
 feature text, action text, tokens_used int default 0, estimated_cost numeric(12,6) default 0, created_at timestamptz default now());
create table if not exists public.payments(
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, plan_id uuid references public.plans(id),
 provider text not null, provider_transaction_id text, amount numeric(10,2), currency text, status text, payment_type text,
 metadata jsonb default '{}'::jsonb, paid_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.domains(
 id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, project_id uuid references public.projects(id) on delete cascade,
 domain text unique not null, type text, status text default 'pending', verification_token text, verified_at timestamptz, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists public.audit_logs(
 id uuid primary key default gen_random_uuid(), actor_user_id uuid references public.profiles(id) on delete set null, target_user_id uuid references public.profiles(id) on delete set null,
 action text not null, entity_type text, entity_id uuid, metadata jsonb default '{}'::jsonb, created_at timestamptz default now());

insert into public.plans(name,slug,price,project_limit,template_limit,ai_action_limit,portfolio_duration_days,advanced_ats,job_matching,cover_letters,analytics_level,seo_level,custom_domain,remove_branding,priority_support,is_featured,sort_order) values
('Free','free',0,1,10,10,7,false,false,false,'none','none',false,false,false,false,1),
('Starter','starter',19,2,25,50,180,true,true,true,'none','basic',false,false,false,false,2),
('Plus','plus',49,4,50,150,365,true,true,true,'basic','advanced',false,false,true,true,3),
('Pro','pro',99,6,75,350,730,true,true,true,'advanced','advanced',true,false,true,false,4),
('Business','business',249,10,100,750,1095,true,true,true,'advanced','advanced',true,true,true,false,5)
on conflict(slug) do update set price=excluded.price,project_limit=excluded.project_limit,template_limit=excluded.template_limit,ai_action_limit=excluded.ai_action_limit,portfolio_duration_days=excluded.portfolio_duration_days;

-- Automatically create a profile and Free entitlement for every new Supabase Auth user.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare free_plan uuid; begin
 insert into public.profiles(id,email,name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'name','')) on conflict(id) do nothing;
 select id into free_plan from public.plans where slug='free' limit 1;
 if free_plan is not null then insert into public.user_plans(user_id,plan_id,projects_granted,ai_actions_granted) values(new.id,free_plan,1,10) on conflict do nothing; end if;
 return new; end; $$;
create unique index if not exists user_plans_one_active on public.user_plans(user_id) where status='active';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_plans enable row level security;
alter table public.project_credits enable row level security;
alter table public.projects enable row level security;
alter table public.ai_usage enable row level security;
alter table public.payments enable row level security;
alter table public.domains enable row level security;
alter table public.templates enable row level security;
alter table public.plans enable row level security;

drop policy if exists "profiles own" on public.profiles; create policy "profiles own" on public.profiles for select using(auth.uid()=id);
drop policy if exists "plans public" on public.plans; create policy "plans public" on public.plans for select using(is_active=true);
drop policy if exists "templates public" on public.templates; create policy "templates public" on public.templates for select using(is_published=true);
drop policy if exists "plans own" on public.user_plans; create policy "plans own" on public.user_plans for select using(auth.uid()=user_id);
drop policy if exists "credits own" on public.project_credits; create policy "credits own" on public.project_credits for select using(auth.uid()=user_id);
drop policy if exists "projects own" on public.projects; create policy "projects own" on public.projects for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "ai own" on public.ai_usage; create policy "ai own" on public.ai_usage for select using(auth.uid()=user_id);
drop policy if exists "payments own" on public.payments; create policy "payments own" on public.payments for select using(auth.uid()=user_id);
drop policy if exists "domains own" on public.domains; create policy "domains own" on public.domains for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

-- Seed 100 portfolio + 100 resume templates. Preview images can be added later from the admin panel/storage.
insert into public.templates(name,slug,type,category,is_free,is_featured,required_template_tier)
select 'Signal '||lpad(g::text,2,'0'),'portfolio-'||g,'portfolio',(array['Minimal','Editorial','Tech','Creative','Executive'])[((g-1)%5)+1],g<=10,g<=3,case when g<=10 then 'free' when g<=25 then 'starter' when g<=50 then 'plus' when g<=75 then 'pro' else 'business' end from generate_series(1,100) g
on conflict(slug) do nothing;
insert into public.templates(name,slug,type,category,is_free,is_featured,required_template_tier)
select 'Clarity '||lpad(g::text,2,'0'),'resume-'||g,'resume',(array['ATS','Minimal','Executive','Modern','Creative'])[((g-1)%5)+1],g<=10,g<=3,case when g<=10 then 'free' when g<=25 then 'starter' when g<=50 then 'plus' when g<=75 then 'pro' else 'business' end from generate_series(1,100) g
on conflict(slug) do nothing;
