-- public.users definition

-- Drop table

-- DROP TABLE public.users;


CREATE TABLE public.users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	username TEXT NOT NULL
);


-- public.quizzes definition

-- Drop table

-- DROP TABLE public.quizzes;

CREATE TABLE public.quizzes (
	id serial4 NOT NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	duration int4 NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT quizzes_pkey PRIMARY KEY (id)
);