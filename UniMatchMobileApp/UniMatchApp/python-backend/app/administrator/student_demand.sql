-- University Administrator - aggregated student demand (run once in the Supabase SQL editor).
--
-- Returns only counts, never a single student's answers, and only to users whose
-- profile role is 'University Administrator'. Groups smaller than 5 students
-- are merged into "Other". Parameters describe the administrator's university:
--   p_region     its region (students preferring it or with no region preference count as interested)
--   p_fee        its yearly international tuition in USD (lowest value)
--   p_living     its yearly living cost in USD (lowest value)
--   p_min_cgpa   its minimum CGPA on a 4.0 scale

create or replace function public.admin_student_demand(
  p_region text default null,
  p_fee numeric default null,
  p_living numeric default null,
  p_min_cgpa numeric default null
) returns json
language plpgsql security definer set search_path = public
as $$
declare
  min_group constant int := 5;
  result json;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'University Administrator') then
    raise exception 'Only university administrators can see student demand';
  end if;

  with students as (
    select
      nullif(trim(g.preferred_region), '') as region,
      nullif(trim(a.intended_education_level), '') as degree,
      nullif(trim(a.field_of_study), '') as field,
      nullif(trim(p.priority_1), '') as priority,
      nullif(trim(f.scholarship_requirement), '') as scholarship,
      nullif(regexp_replace(f.max_tuition_fee::text, '[^0-9.]', '', 'g'), '')::numeric as max_fee,
      nullif(regexp_replace(f.living_cost_tolerance::text, '[^0-9.]', '', 'g'), '')::numeric as max_living,
      case
        when a.score_type = 'CGPA' then a.score_value::numeric
             / nullif(nullif(regexp_replace(a.cgpa_scale::text, '[^0-9.]', '', 'g'), '')::numeric, 0) * 4
        when a.score_value is not null then a.score_value::numeric / 25
      end as gpa4
    from profiles pr
    join academic_preferences a on a.user_id = pr.id
    left join geographic_preferences g on g.user_id = pr.id
    left join financial_preferences f on f.user_id = pr.id
    left join priority_preferences p on p.user_id = pr.id
    where pr.role = 'Student'
  ),
  interested as (
    select * from students
    where p_region is null or region is null or region ilike p_region or region ilike 'any%' or region ilike 'all%'
  )
  select json_build_object(
    'total', (select count(*) from students),
    'interested', (select count(*) from interested),
    'min_group', min_group,
    'by_region', (select json_agg(json_build_object('label', label, 'count', n) order by n desc) from (
        select case when count(*) >= min_group then coalesce(region, 'No preference') else 'Other' end as label, count(*) as n
        from students group by region) x),
    'by_priority', (select json_agg(json_build_object('label', label, 'count', n) order by n desc) from (
        select case when count(*) >= min_group then coalesce(priority, 'Not given') else 'Other' end as label, count(*) as n
        from interested group by priority) x),
    'by_degree', (select json_agg(json_build_object('label', label, 'count', n) order by n desc) from (
        select case when count(*) >= min_group then coalesce(degree, 'Not given') else 'Other' end as label, count(*) as n
        from interested group by degree) x),
    'by_field', (select json_agg(json_build_object('label', label, 'count', n) order by n desc) from (
        select case when count(*) >= min_group then coalesce(field, 'Not given') else 'Other' end as label, count(*) as n
        from interested group by field) x),
    'by_scholarship', (select json_agg(json_build_object('label', label, 'count', n) order by n desc) from (
        select case when count(*) >= min_group then coalesce(scholarship, 'Not given') else 'Other' end as label, count(*) as n
        from interested group by scholarship) x),
    'fee_blocked', (select count(*) from interested where p_fee is not null and max_fee > 0 and max_fee < p_fee),
    'living_blocked', (select count(*) from interested where p_living is not null and max_living > 0 and max_living < p_living),
    'cgpa_blocked', (select count(*) from interested where p_min_cgpa is not null and gpa4 < p_min_cgpa),
    'fits_all', (select count(*) from interested where
        not (p_fee is not null and max_fee > 0 and max_fee < p_fee)
        and not (p_living is not null and max_living > 0 and max_living < p_living)
        and not (p_min_cgpa is not null and gpa4 < p_min_cgpa))
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_student_demand(text, numeric, numeric, numeric) from public, anon;
grant execute on function public.admin_student_demand(text, numeric, numeric, numeric) to authenticated;
