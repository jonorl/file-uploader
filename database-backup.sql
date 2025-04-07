--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 17.4 (Ubuntu 17.4-1.pgdg22.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: board; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.board (
    message_id integer NOT NULL,
    email character varying(255) NOT NULL,
    text text NOT NULL,
    message_created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    title text NOT NULL
);


ALTER TABLE public.board OWNER TO postgres;

--
-- Name: board_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.board_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.board_message_id_seq OWNER TO postgres;

--
-- Name: board_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.board_message_id_seq OWNED BY public.board.message_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(50) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    visits integer DEFAULT 1,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'user'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: board message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board ALTER COLUMN message_id SET DEFAULT nextval('public.board_message_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: board; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.board (message_id, email, text, message_created_at, title) FROM stdin;
4	8hqczgwx8@mozmail.com	Test1	2025-04-02 14:51:18.816654	Title1
11	mayerrak@gmail.com	This is my message	2025-04-03 18:29:53.83322	Hi
12	jlescarlan@gmail.com	yee	2025-04-06 17:57:38.269415	yyyg
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, first_name, last_name, email, password_hash, role, created_at, updated_at, visits) FROM stdin;
24	JonFour	OrloFour	jon4@orlo.com	$2b$10$8xPUda5BZSb.tmeeOyBGduf6WU7QUIqdx0skTRSVcx4kPxk3B/t7G	user	2025-04-04 08:57:33.092946	2025-04-04 08:57:33.092946	1
16	Jontwo	Orlotwo	kyfll7dii@mozmail.com	$2b$10$n.O.0TQIQ2jG.pD8hfGEnuK.hT9mMwj8k9nRP9NnJ6ibCXUsfsUfO	member	2025-04-03 12:45:25.37851	2025-04-03 12:45:25.37851	0
19	Jonthree	Orlothree	cxi59ebgx@mozmail.com	$2b$10$wusZCUcfePU2JemJJv64c.a9wdXqSD8uRFUGqj9GW886LXlO904py	user	2025-04-03 14:32:16.974701	2025-04-03 14:32:16.974701	0
25	jonFive	OrloFive	jon5@orlo.com	$2b$10$ACCDbdKp3QrT3HTQ6Smc3e6ylxyo0iajMDleyTin.Ft6t1XIQx.2y	user	2025-04-04 09:09:25.308656	2025-04-04 09:26:29.3764	6
21	Jojo	OrloOrlo	jojo@orloorlo.com	$2b$10$HjuQLIymS0f66VoqgeG5IODywu0Ts5RdXILZfDBHpolybx7xnnKfi	user	2025-04-03 15:27:42.954075	2025-04-03 15:27:42.954075	1
26	jl	edc	jlescarlan@gmail.com	$2b$10$2/2PaOaP4jvQmZBhwOl8Z.mwer/QNiTdWkTxLwpF.55TNnR7AVaaS	admin	2025-04-06 17:57:19.946712	2025-04-06 17:57:19.946712	1
22	Johnjohn	Orlooo	pnjckwyq4@mozmail.com	$2b$10$PAVIdIToReUPJaoIPM/Nu.fOAV0DYRiaJZOJf9.FVjt584Pl5CIyG	admin	2025-04-03 18:28:44	2025-04-07 10:32:27.411209	3
23	Rachel	Mayer	mayerrak@gmail.com	$2b$10$5ueKD65ybNCpJ2PsHfl74uLLbTuKGEAXjYIK/2DF/nQHSWinb2TZ.	member	2025-04-03 18:28:27.847457	2025-04-03 18:30:59.076201	3
15	Jon	Orlo	8hqczgwx8@mozmail.com	$2b$10$W8J.UleWjNnjIgYdFAbJTOrC6l1A0kPXskL1MePYXNqqdq3CqpuO6	admin	2025-04-02 17:49:26	2025-04-04 08:32:40.822578	7
\.


--
-- Name: board_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.board_message_id_seq', 12, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 26, true);


--
-- Name: board board_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board
    ADD CONSTRAINT board_pkey PRIMARY KEY (message_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: board board_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.board
    ADD CONSTRAINT board_email_fkey FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

