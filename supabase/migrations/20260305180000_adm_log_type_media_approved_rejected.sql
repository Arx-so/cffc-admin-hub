-- Log types for video approval/rejection in Vídeos em Análise
ALTER TYPE public.adm_log_type ADD VALUE IF NOT EXISTS 'media_approved';
ALTER TYPE public.adm_log_type ADD VALUE IF NOT EXISTS 'media_rejected';
