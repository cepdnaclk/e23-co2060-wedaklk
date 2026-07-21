-- Mock PR: Provider Stats Rollup Trigger
CREATE OR REPLACE FUNCTION update_provider_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.provider_profiles
        SET 
            total_reviews = total_reviews + 1,
            average_rating = (
                SELECT AVG(rating)::NUMERIC(3,2) 
                FROM public.reviews 
                WHERE provider_id = NEW.provider_id
            )
        WHERE id = NEW.provider_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_provider_stats();
