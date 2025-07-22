-- Create meetings table
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  time time not null,
  participants uuid[] not null, -- array of user IDs
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default timezone('utc', now()) not null
);

-- Enable Row Level Security
alter table public.meetings enable row level security;

-- Organizer can do anything
create policy "Organizer can do anything"
  on public.meetings
  for all
  using (auth.uid() = created_by);

-- Participants can view
create policy "Participants can view"
  on public.meetings
  for select
  using (auth.uid() = ANY(participants));

-- Admins can view all (if you have a profiles table with a role column)
create policy "Admins can view all"
  on public.meetings
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Grant permissions
grant select, insert, update, delete on public.meetings to authenticated; 