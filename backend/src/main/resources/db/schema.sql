-- ShopLine database schema.
-- Runs automatically every time the server starts. Every statement is idempotent
-- ("if not exists"), so it is safe to run against a database that is already set up.

create table if not exists users (
    id            bigserial    primary key,
    name          varchar(100) not null,
    email         varchar(255) not null unique,
    password_hash varchar(255) not null,
    role          varchar(20)  not null check (role in ('admin', 'vendor', 'customer')),
    -- Only vendors have an approval status; it is null for customers and admins.
    vendor_status varchar(20)  check (vendor_status in ('pending', 'approved', 'rejected')),
    phone         varchar(30)  not null default '',
    address       varchar(300) not null default '',
    created_at    timestamptz  not null default now()
);

create table if not exists shops (
    id          bigserial     primary key,
    vendor_id   bigint        not null unique references users (id) on delete cascade,
    name        varchar(100)  not null,
    description varchar(1000) not null default '',
    category    varchar(50)   not null default '',
    address     varchar(300)  not null default '',
    phone       varchar(30)   not null default '',
    image       varchar(500)  not null default '',
    created_at  timestamptz   not null default now(),
    updated_at  timestamptz   not null default now()
);

create table if not exists products (
    id          bigserial     primary key,
    shop_id     bigint        not null references shops (id) on delete cascade,
    name        varchar(120)  not null,
    description varchar(1000) not null default '',
    category    varchar(50)   not null default '',
    image       varchar(500)  not null default '',
    price       numeric(10,2) not null check (price >= 0),
    stock       integer       not null default 0 check (stock >= 0),
    status      varchar(20)   not null default 'active' check (status in ('active', 'inactive')),
    created_at  timestamptz   not null default now(),
    updated_at  timestamptz   not null default now()
);
create index if not exists idx_products_shop on products (shop_id);

-- One order per shop. A checkout with items from several shops creates several orders.
-- customer_name and shop_name are copied in so order history survives account deletion.
create table if not exists orders (
    id               bigserial     primary key,
    customer_id      bigint        references users (id) on delete set null,
    shop_id          bigint        references shops (id) on delete set null,
    customer_name    varchar(100)  not null,
    shop_name        varchar(100)  not null,
    delivery_address varchar(300)  not null,
    total            numeric(10,2) not null check (total >= 0),
    status           varchar(20)   not null default 'pending'
                     check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at       timestamptz   not null default now(),
    updated_at       timestamptz   not null default now()
);
create index if not exists idx_orders_customer on orders (customer_id);
create index if not exists idx_orders_shop on orders (shop_id);

-- Name and price are copied from the product at checkout time, so later price
-- changes don't rewrite past orders.
create table if not exists order_items (
    id         bigserial     primary key,
    order_id   bigint        not null references orders (id) on delete cascade,
    product_id bigint        references products (id) on delete set null,
    name       varchar(120)  not null,
    price      numeric(10,2) not null,
    qty        integer       not null check (qty > 0)
);
create index if not exists idx_order_items_order on order_items (order_id);

-- Supabase exposes tables in the public schema through its auto-generated REST API.
-- Enabling row level security with no policies blocks that access path entirely;
-- this server connects as the table owner, which is not affected.
alter table users       enable row level security;
alter table shops       enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
