
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'candidato');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','gestor'))
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles ins" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles upd" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles del" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- atribuir role candidato no signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'candidato') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ============ CATÁLOGOS ============
CREATE TABLE public.provinces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province_id uuid NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (province_id, name)
);

CREATE TABLE public.careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.occupations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (career_id, name)
);

CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sector text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Política genérica para catálogos: leitura autenticada, escrita staff
DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['provinces','districts','careers','occupations','institutions']) LOOP
    EXECUTE format('CREATE POLICY "read %1$s auth" ON public.%1$s FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "staff ins %1$s" ON public.%1$s FOR INSERT WITH CHECK (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "staff upd %1$s" ON public.%1$s FOR UPDATE USING (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "staff del %1$s" ON public.%1$s FOR DELETE USING (public.is_staff(auth.uid()))', t);
  END LOOP;
END $$;

-- Seed províncias de Moçambique
INSERT INTO public.provinces (name) VALUES
  ('Maputo Cidade'),('Maputo Província'),('Gaza'),('Inhambane'),('Sofala'),
  ('Manica'),('Tete'),('Zambézia'),('Nampula'),('Cabo Delgado'),('Niassa');

-- ============ PERFIL CANDIDATO ============
CREATE TABLE public.candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  gender text,
  marital_status text,
  birth_date date,
  father_name text,
  mother_name text,
  province_id uuid REFERENCES public.provinces(id),
  district_id uuid REFERENCES public.districts(id),
  phone text,
  doc_type text,
  doc_number text,
  doc_validity date,
  education_level text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL, -- pos-graduacao, mestrado, doutoramento, formacao
  institution text NOT NULL,
  course text NOT NULL,
  year int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company text NOT NULL,
  role text NOT NULL,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_internships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution text NOT NULL,
  area text,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.candidate_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text,
  year int,
  hours int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_courses ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['candidate_profiles','candidate_education','candidate_experience','candidate_internships','candidate_courses']) LOOP
    EXECUTE format('CREATE POLICY "owner select %1$s" ON public.%1$s FOR SELECT USING (auth.uid() = user_id OR public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "owner ins %1$s" ON public.%1$s FOR INSERT WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "owner upd %1$s" ON public.%1$s FOR UPDATE USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "owner del %1$s" ON public.%1$s FOR DELETE USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

CREATE TRIGGER trg_candidate_profiles_updated BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CONCURSOS ============
CREATE TABLE public.contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designation text NOT NULL,
  year int NOT NULL,
  institution_id uuid REFERENCES public.institutions(id),
  status text NOT NULL DEFAULT 'rascunho', -- rascunho, publicado, encerrado
  published_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contest_provinces (
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  province_id uuid NOT NULL REFERENCES public.provinces(id) ON DELETE CASCADE,
  PRIMARY KEY (contest_id, province_id)
);

CREATE TABLE public.contest_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  occupation_id uuid NOT NULL REFERENCES public.occupations(id),
  vacancies int NOT NULL DEFAULT 1,
  UNIQUE (contest_id, occupation_id)
);

ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read contests" ON public.contests FOR SELECT TO authenticated
  USING (status = 'publicado' OR public.is_staff(auth.uid()));
CREATE POLICY "staff ins contests" ON public.contests FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff upd contests" ON public.contests FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "staff del contests" ON public.contests FOR DELETE USING (public.is_staff(auth.uid()));

CREATE POLICY "read cp" ON public.contest_provinces FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff ins cp" ON public.contest_provinces FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff del cp" ON public.contest_provinces FOR DELETE USING (public.is_staff(auth.uid()));

CREATE POLICY "read cpos" ON public.contest_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff ins cpos" ON public.contest_positions FOR INSERT WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff upd cpos" ON public.contest_positions FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "staff del cpos" ON public.contest_positions FOR DELETE USING (public.is_staff(auth.uid()));

-- ============ CANDIDATURAS ============
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_id uuid NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  contest_position_id uuid NOT NULL REFERENCES public.contest_positions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submetida', -- submetida, em_analise, entrevista, aprovado, rejeitado
  final_score numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, contest_position_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own app or staff" ON public.applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "own insert app" ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff update app" ON public.applications FOR UPDATE
  USING (public.is_staff(auth.uid()));
CREATE POLICY "own or staff delete app" ON public.applications FOR DELETE
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
