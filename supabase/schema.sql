create extension if not exists pgcrypto;

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  legal_name text not null default '',
  trade_name text not null default '',
  tax_id text not null default '',
  address text not null default '',
  postal_code text not null default '',
  city text not null default '',
  province text not null default '',
  country text not null default 'España',
  email text not null default '',
  phone text not null default '',
  iban text not null default '',
  logo_url text,
  invoice_prefix text not null default 'AIBE',
  next_invoice_number integer not null default 1 check (next_invoice_number > 0),
  footer_text text not null default 'Gracias por su confianza',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  tax_id text not null,
  address text not null default '',
  postal_code text not null default '',
  city text not null default '',
  province text not null default '',
  country text not null default 'España',
  email text not null default '',
  payment_method text not null default 'Transferencia bancaria',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  service_name text not null,
  service_description text not null default '',
  base_amount numeric(12,2) not null check (base_amount >= 0),
  tax_type text not null check (tax_type in ('IVA', 'IGIC', 'EXENTO')),
  tax_rate numeric(5,2) not null default 0 check (tax_rate >= 0),
  apply_irpf boolean not null default true,
  irpf_rate numeric(5,2) not null default 7 check (irpf_rate >= 0),
  renewal_day integer not null check (renewal_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  subscription_id uuid references public.subscriptions(id),
  invoice_number text not null,
  billing_period text not null,
  issue_date date not null,
  status text not null default 'issued' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  seller_snapshot jsonb not null,
  client_snapshot jsonb not null,
  service_name text not null,
  service_description text not null default '',
  payment_method text not null default '',
  subtotal numeric(12,2) not null,
  tax_type text not null,
  tax_rate numeric(5,2) not null,
  tax_amount numeric(12,2) not null,
  irpf_rate numeric(5,2) not null,
  irpf_amount numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  pdf_path text,
  created_at timestamptz not null default now(),
  unique (user_id, invoice_number),
  unique (subscription_id, billing_period)
);

-- Estado del envío por correo (se rellena al emitir la factura, tanto por
-- el cron diario como por el botón manual "Generar facturas del mes", y
-- también al usar el botón de reenvío manual desde el panel).
alter table public.invoices add column if not exists email_sent_at timestamptz;
alter table public.invoices add column if not exists email_error text;

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists invoices_user_id_issue_date_idx on public.invoices(user_id, issue_date desc);

alter table public.company_settings enable row level security;
alter table public.clients enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;

-- CREATE POLICY no admite "if not exists" (a diferencia de las
-- tablas/índices), así que hay que borrar la política antes de
-- recrearla para que este archivo se pueda ejecutar varias veces sin
-- error.
drop policy if exists "company own rows" on public.company_settings;
create policy "company own rows" on public.company_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "clients own rows" on public.clients;
create policy "clients own rows" on public.clients
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscriptions own rows" on public.subscriptions;
create policy "subscriptions own rows" on public.subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Las facturas se leen, se crean y se borran, pero SIEMPRE a través de
-- funciones controladas: crear pasa por issue_subscription_invoice(),
-- borrar pasa por delete_invoice() (ver más abajo). Por eso aquí, a
-- propósito, NO hay policy de DELETE ni se permite borrar la fila
-- directamente desde el cliente (supabase-js `.delete()`): así
-- garantizamos que un borrado SIEMPRE recoloca la numeración
-- correlativa y nunca deja un hueco, aunque cambie el código de la
-- aplicación en el futuro.
drop policy if exists "invoices own rows" on public.invoices;

drop policy if exists "invoices select own" on public.invoices;
create policy "invoices select own" on public.invoices
for select using (auth.uid() = user_id);

drop policy if exists "invoices insert own" on public.invoices;
create policy "invoices insert own" on public.invoices
for insert with check (auth.uid() = user_id);

drop policy if exists "invoices update own" on public.invoices;
create policy "invoices update own" on public.invoices
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Refuerzo adicional: ni siquiera con acceso directo a la tabla se
-- puede alterar el número, la fecha de emisión, el importe o el
-- propietario de una factura ya creada. La única excepción es el
-- renumerado controlado que hace delete_invoice() al cerrar un hueco,
-- que se identifica con la marca de sesión 'facturas.allow_renumber'.
create or replace function public.protect_invoice_integrity()
returns trigger
language plpgsql
as $$
declare
  v_renumbering boolean := coalesce(current_setting('facturas.allow_renumber', true), '') = 'on';
begin
  if not v_renumbering and (
    new.invoice_number is distinct from old.invoice_number
    or new.issue_date is distinct from old.issue_date
  ) then
    raise exception 'No se puede modificar el número ni la fecha de emisión de una factura ya emitida.';
  end if;

  if new.user_id is distinct from old.user_id
    or new.subtotal is distinct from old.subtotal
    or new.tax_amount is distinct from old.tax_amount
    or new.irpf_amount is distinct from old.irpf_amount
    or new.total_amount is distinct from old.total_amount
  then
    raise exception 'No se pueden modificar los importes ni el propietario de una factura ya emitida.';
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_protect_integrity on public.invoices;
create trigger invoices_protect_integrity
before update on public.invoices
for each row execute function public.protect_invoice_integrity();

create or replace function public.issue_subscription_invoice(
  p_subscription_id uuid,
  p_issue_date date,
  p_billing_period text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription public.subscriptions;
  v_client public.clients;
  v_company public.company_settings;
  v_invoice_id uuid;
  v_invoice_number text;
  v_last_issue_date date;
  v_tax numeric(12,2);
  v_irpf numeric(12,2);
  v_total numeric(12,2);
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  select * into v_subscription
  from public.subscriptions
  where id = p_subscription_id and user_id = v_user_id and active = true;

  if not found then raise exception 'Suscripción no encontrada'; end if;

  select * into v_client
  from public.clients
  where id = v_subscription.client_id and user_id = v_user_id and active = true;

  if not found then raise exception 'Cliente no encontrado'; end if;

  select * into v_company
  from public.company_settings
  where user_id = v_user_id
  for update;

  if not found then raise exception 'Configura primero los datos de empresa'; end if;

  -- Si ya existe una factura para esta suscripción en este periodo, no
  -- se repite (idempotente): se sale sin generar nada ni dar error. Esto
  -- tiene que comprobarse ANTES del control de orden cronológico de
  -- abajo, porque si no, reintentar generar una factura que ya existe
  -- (por ejemplo al pulsar "Generar facturas del mes" varias veces)
  -- puede chocar con facturas más recientes de otras suscripciones y
  -- bloquear el botón con un error que no tiene sentido.
  if exists (
    select 1 from public.invoices
    where subscription_id = p_subscription_id
      and billing_period = p_billing_period
  ) then
    return null;
  end if;

  -- La numeración debe ir siempre en el mismo orden que las fechas de
  -- emisión: el siguiente número nunca puede llevar una fecha
  -- anterior a la de la última factura ya emitida (correlativo por
  -- fecha de emisión, sin excepciones ni "huecos" para colar facturas
  -- retroactivas fuera de orden).
  select max(issue_date) into v_last_issue_date
  from public.invoices
  where user_id = v_user_id;

  if v_last_issue_date is not null and p_issue_date < v_last_issue_date then
    raise exception 'La fecha de emisión (%) es anterior a la de la última factura emitida (%). No se puede romper el orden cronológico de la numeración.', p_issue_date, v_last_issue_date;
  end if;

  v_invoice_number :=
    v_company.invoice_prefix || '-' ||
    extract(year from p_issue_date)::integer || '-' ||
    lpad(v_company.next_invoice_number::text, 4, '0');

  v_tax := round(v_subscription.base_amount * v_subscription.tax_rate / 100, 2);
  v_irpf := case when v_subscription.apply_irpf
    then round(v_subscription.base_amount * v_subscription.irpf_rate / 100, 2)
    else 0 end;
  v_total := v_subscription.base_amount + v_tax - v_irpf;

  insert into public.invoices (
    user_id, client_id, subscription_id, invoice_number, billing_period,
    issue_date, seller_snapshot, client_snapshot, service_name,
    service_description, payment_method, subtotal, tax_type, tax_rate,
    tax_amount, irpf_rate, irpf_amount, total_amount
  ) values (
    v_user_id, v_client.id, v_subscription.id, v_invoice_number, p_billing_period,
    p_issue_date,
    jsonb_build_object(
      'legal_name', v_company.legal_name, 'trade_name', v_company.trade_name,
      'tax_id', v_company.tax_id, 'address', v_company.address,
      'postal_code', v_company.postal_code, 'city', v_company.city,
      'province', v_company.province, 'country', v_company.country,
      'email', v_company.email, 'phone', v_company.phone,
      'iban', v_company.iban, 'logo_url', v_company.logo_url,
      'footer_text', v_company.footer_text
    ),
    jsonb_build_object(
      'business_name', v_client.business_name, 'tax_id', v_client.tax_id,
      'address', v_client.address, 'postal_code', v_client.postal_code,
      'city', v_client.city, 'province', v_client.province,
      'country', v_client.country, 'email', v_client.email
    ),
    v_subscription.service_name, v_subscription.service_description,
    v_client.payment_method, v_subscription.base_amount,
    v_subscription.tax_type, v_subscription.tax_rate, v_tax,
    case when v_subscription.apply_irpf then v_subscription.irpf_rate else 0 end,
    v_irpf, v_total
  )
  returning id into v_invoice_id;

  update public.company_settings
  set next_invoice_number = next_invoice_number + 1, updated_at = now()
  where id = v_company.id;

  return v_invoice_id;
end;
$$;


create or replace function public.issue_subscription_invoice_admin(
  p_subscription_id uuid,
  p_issue_date date,
  p_billing_period text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscription public.subscriptions;
  v_client public.clients;
  v_company public.company_settings;
  v_invoice_id uuid;
  v_invoice_number text;
  v_last_issue_date date;
  v_tax numeric(12,2);
  v_irpf numeric(12,2);
  v_total numeric(12,2);
begin
  if auth.role() <> 'service_role' then
    raise exception 'No autorizado';
  end if;

  select * into v_subscription
  from public.subscriptions
  where id = p_subscription_id and active = true;

  if not found then raise exception 'Suscripción no encontrada'; end if;

  select * into v_client
  from public.clients
  where id = v_subscription.client_id
    and user_id = v_subscription.user_id
    and active = true;

  if not found then raise exception 'Cliente no encontrado'; end if;

  select * into v_company
  from public.company_settings
  where user_id = v_subscription.user_id
  for update;

  if not found then raise exception 'Empresa no configurada'; end if;

  -- Mismo refuerzo que en issue_subscription_invoice: si ya existe
  -- factura para esta suscripción y periodo, se sale sin más (el "on
  -- conflict do nothing" de más abajo ya lo cubre a nivel de inserción,
  -- pero hace falta cortar aquí también para no chocar antes de tiempo
  -- con el control de orden cronológico).
  if exists (
    select 1 from public.invoices
    where subscription_id = p_subscription_id
      and billing_period = p_billing_period
  ) then
    return null;
  end if;

  -- Mismo refuerzo que en issue_subscription_invoice: el orden de la
  -- numeración debe respetar siempre el orden de las fechas de
  -- emisión, también en las facturas generadas por el cron.
  select max(issue_date) into v_last_issue_date
  from public.invoices
  where user_id = v_subscription.user_id;

  if v_last_issue_date is not null and p_issue_date < v_last_issue_date then
    raise exception 'La fecha de emisión (%) es anterior a la de la última factura emitida (%). No se puede romper el orden cronológico de la numeración.', p_issue_date, v_last_issue_date;
  end if;

  v_invoice_number :=
    v_company.invoice_prefix || '-' ||
    extract(year from p_issue_date)::integer || '-' ||
    lpad(v_company.next_invoice_number::text, 4, '0');

  v_tax := round(v_subscription.base_amount * v_subscription.tax_rate / 100, 2);
  v_irpf := case when v_subscription.apply_irpf
    then round(v_subscription.base_amount * v_subscription.irpf_rate / 100, 2)
    else 0 end;
  v_total := v_subscription.base_amount + v_tax - v_irpf;

  insert into public.invoices (
    user_id, client_id, subscription_id, invoice_number, billing_period,
    issue_date, seller_snapshot, client_snapshot, service_name,
    service_description, payment_method, subtotal, tax_type, tax_rate,
    tax_amount, irpf_rate, irpf_amount, total_amount
  ) values (
    v_subscription.user_id, v_client.id, v_subscription.id,
    v_invoice_number, p_billing_period, p_issue_date,
    jsonb_build_object(
      'legal_name', v_company.legal_name, 'trade_name', v_company.trade_name,
      'tax_id', v_company.tax_id, 'address', v_company.address,
      'postal_code', v_company.postal_code, 'city', v_company.city,
      'province', v_company.province, 'country', v_company.country,
      'email', v_company.email, 'phone', v_company.phone,
      'iban', v_company.iban, 'logo_url', v_company.logo_url,
      'footer_text', v_company.footer_text
    ),
    jsonb_build_object(
      'business_name', v_client.business_name, 'tax_id', v_client.tax_id,
      'address', v_client.address, 'postal_code', v_client.postal_code,
      'city', v_client.city, 'province', v_client.province,
      'country', v_client.country, 'email', v_client.email
    ),
    v_subscription.service_name, v_subscription.service_description,
    v_client.payment_method, v_subscription.base_amount,
    v_subscription.tax_type, v_subscription.tax_rate, v_tax,
    case when v_subscription.apply_irpf then v_subscription.irpf_rate else 0 end,
    v_irpf, v_total
  )
  on conflict (subscription_id, billing_period) do nothing
  returning id into v_invoice_id;

  if v_invoice_id is not null then
    update public.company_settings
    set next_invoice_number = next_invoice_number + 1, updated_at = now()
    where id = v_company.id;
  end if;

  return v_invoice_id;
end;
$$;

revoke all on function public.issue_subscription_invoice_admin(uuid, date, text) from public;
grant execute on function public.issue_subscription_invoice_admin(uuid, date, text) to service_role;


-- Borrar una factura y CERRAR EL HUECO al instante: la fila
-- desaparece de verdad (como pediste) y, en el mismo movimiento,
-- todas las facturas del mismo usuario emitidas después se
-- renumeran una posición hacia abajo, así la secuencia
-- 0001, 0002, 0003... nunca tiene saltos.
--
-- Aviso importante (deja constancia en el propio código): si alguna
-- de las facturas renumeradas ya se había descargado/enviado a un
-- cliente con su número anterior, ese número cambia igualmente. Esa
-- es la contrapartida de garantizar cero huecos siempre, y así se
-- decidió usarlo a propósito.
create or replace function public.delete_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_invoice public.invoices;
  v_deleted_seq integer;
  v_row record;
  v_new_number text;
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  -- Bloquea la fila de configuración de la empresa para que dos
  -- borrados simultáneos del mismo usuario no puedan renumerar y
  -- decrementar el contador a la vez (misma técnica que usa
  -- issue_subscription_invoice para serializar la creación).
  perform 1
  from public.company_settings
  where user_id = v_user_id
  for update;

  select * into v_invoice
  from public.invoices
  where id = p_invoice_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Factura no encontrada';
  end if;

  v_deleted_seq := substring(v_invoice.invoice_number from '(\d+)$')::integer;

  if v_deleted_seq is null then
    raise exception 'No se ha podido interpretar el número de la factura a borrar (%)', v_invoice.invoice_number;
  end if;

  -- Deja pasar, solo dentro de esta transacción, el renumerado
  -- controlado que viene a continuación (el trigger de protección lo
  -- comprueba y en cualquier otro caso sigue bloqueando cambios de
  -- número o fecha).
  perform set_config('facturas.allow_renumber', 'on', true);

  delete from public.invoices
  where id = p_invoice_id and user_id = v_user_id;

  for v_row in
    select id, invoice_number
    from public.invoices
    where user_id = v_user_id
      and substring(invoice_number from '(\d+)$')::integer > v_deleted_seq
    order by substring(invoice_number from '(\d+)$')::integer asc
  loop
    v_new_number := regexp_replace(
      v_row.invoice_number,
      '(\d+)$',
      lpad((substring(v_row.invoice_number from '(\d+)$')::integer - 1)::text, 4, '0')
    );

    update public.invoices
    set invoice_number = v_new_number
    where id = v_row.id;
  end loop;

  update public.company_settings
  set next_invoice_number = greatest(next_invoice_number - 1, 1),
      updated_at = now()
  where user_id = v_user_id;
end;
$$;

revoke all on function public.delete_invoice(uuid) from public;
grant execute on function public.delete_invoice(uuid) to authenticated;
