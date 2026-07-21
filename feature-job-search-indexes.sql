-- Mock PR: Job Search Performance Indexes
-- Index for geographical searches
CREATE INDEX idx_jobs_location ON public.jobs (province, district, city);

-- Index for filtering by status (very common query)
CREATE INDEX idx_jobs_status ON public.jobs (status);

-- Index for text search on job titles
CREATE INDEX idx_jobs_title_search ON public.jobs USING GIN (to_tsvector('english', title));
