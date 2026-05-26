-- Coluna verified no profile (conta validada pelo admin)
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profile.verified IS 'Conta validada (ação Validar conta na gestão de usuários).';

-- Migrar dados existentes: quem já tem validação aprovada vira verified = true
UPDATE public.profile p
SET verified = true
WHERE EXISTS (
  SELECT 1 FROM public.validation v
  WHERE v.athlete_user_id = p.id AND v.status = 'approved'
);

-- Admin pode atualizar profile (ex.: verified)
CREATE POLICY "profile_update_admin"
  ON public.profile
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profile pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );
