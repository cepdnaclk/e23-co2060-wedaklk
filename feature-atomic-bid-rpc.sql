-- Mock PR: Atomic Bid Acceptance RPC
CREATE OR REPLACE FUNCTION accept_bid(bid_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_job_id UUID;
    target_provider_id UUID;
BEGIN
    -- Get job details
    SELECT job_id, provider_id INTO target_job_id, target_provider_id 
    FROM public.bids WHERE id = bid_id;

    -- Update accepted bid
    UPDATE public.bids SET status = 'accepted' WHERE id = bid_id;
    
    -- Reject all others
    UPDATE public.bids SET status = 'rejected' 
    WHERE job_id = target_job_id AND id != bid_id;
    
    -- Update job status
    UPDATE public.jobs SET status = 'assigned', assigned_provider_id = target_provider_id 
    WHERE id = target_job_id;
END;
$$;
