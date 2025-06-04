-- Enable the vector extension for pgvector
create extension if not exists "vector" with schema "extensions";

-- Create regions table
create table "public"."regions" (
    "id" serial primary key,
    "name" text not null unique,
    "created_at" timestamp with time zone not null default now()
);

-- Create users table
create table "public"."users" (
    "id" serial primary key,
    "email" text not null unique,
    "name" text not null,
    "role" text not null check (role in ('salesperson', 'sales_manager')),
    "region_id" integer not null references regions(id),
    "created_at" timestamp with time zone not null default now()
);

-- Create customers table
create table "public"."customers" (
    "id" serial primary key,
    "name" text not null,
    "company" text not null,
    "region_id" integer not null references regions(id),
    "salesperson_id" integer references users(id),
    "created_at" timestamp with time zone not null default now()
);

-- Create customer_notes table
create table "public"."customer_notes" (
    "id" serial primary key,
    "customer_id" integer not null references customers(id),
    "content" text not null,
    "note_type" text not null,
    "created_at" timestamp with time zone not null default now()
);

-- Create blocks table for vector embeddings
create table "public"."blocks" (
    "id" serial primary key,
    "customer_note_id" integer not null references customer_notes(id),
    "content" text not null,
    "embedding" vector(1536), -- OpenAI text-embedding-3-small dimension
    "created_at" timestamp with time zone not null default now()
);

-- Create indexes for better performance
create index on users(email);
create index on users(region_id);
create index on customers(region_id);
create index on customers(salesperson_id);
create index on customer_notes(customer_id);
create index on blocks(customer_note_id);

-- Create vector similarity index
create index on blocks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Add RLS (Row Level Security) policies if needed
alter table regions enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table customer_notes enable row level security;
alter table blocks enable row level security;

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated; 