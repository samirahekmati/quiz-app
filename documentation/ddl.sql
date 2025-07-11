-- public.users definition

-- Drop table

-- DROP TABLE public.users;


CREATE TABLE public.users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	username VARCHAR(50) NOT NULL
);