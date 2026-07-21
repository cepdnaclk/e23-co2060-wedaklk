-- Mock PR: Dispute Resolution System
CREATE TYPE dispute_status AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED');

CREATE TABLE public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    raised_by UUID REFERENCES public.profiles(id),
    reason TEXT NOT NULL,
    status dispute_status DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view disputes for their jobs" ON public.disputes
FOR SELECT USING (
    raised_by = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND (j.client_id = auth.uid() OR j.provider_id = auth.uid()))
);
