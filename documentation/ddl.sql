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


-- public.questions definition

-- Drop table

-- DROP TABLE public.questions;

CREATE TABLE public.questions (
	id serial4 NOT NULL,
	quiz_id int4 NULL,
	"text" text NOT NULL,
	"type" varchar(50) DEFAULT 'multiple_choice'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	difficulty_level public.difficulty_enum NULL,
	CONSTRAINT questions_pkey PRIMARY KEY (id),
	CONSTRAINT questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE
);

-- public."options" definition

-- Drop table

-- DROP TABLE public."options";

CREATE TABLE public."options" (
	id int4 DEFAULT nextval('answers_id_seq'::regclass) NOT NULL,
	question_id int4 NULL,
	"text" text NOT NULL,
	is_correct bool DEFAULT false NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT answers_pkey PRIMARY KEY (id),
	CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
);