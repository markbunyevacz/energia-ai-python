-- Create processing_rules table
CREATE TABLE IF NOT EXISTS processing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES legal_domains(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,
  priority INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create compliance_requirements table
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES legal_domains(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  deadline_type VARCHAR(50) NOT NULL,
  standard_period_days INTEGER,
  grace_period_days INTEGER,
  affected_entities TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_processing_rules_domain_id ON processing_rules(domain_id);
CREATE INDEX IF NOT EXISTS idx_compliance_requirements_domain_id ON compliance_requirements(domain_id);

-- Data migration script
DO $$
DECLARE
    domain_record RECORD;
    rule JSONB;
    req JSONB;
BEGIN
    FOR domain_record IN SELECT id, processing_rules, compliance_requirements FROM legal_domains LOOP
        -- Migrate processing rules
        FOR rule IN SELECT * FROM jsonb_array_elements(domain_record.processing_rules) LOOP
            INSERT INTO processing_rules (domain_id, name, description, pattern, priority)
            VALUES (domain_record.id, rule->>'name', rule->>'description', rule->>'pattern', (rule->>'priority')::INTEGER);
        END LOOP;

        -- Migrate compliance requirements
        FOR req IN SELECT * FROM jsonb_array_elements(domain_record.compliance_requirements) LOOP
            INSERT INTO compliance_requirements (domain_id, name, description, deadline_type, standard_period_days, grace_period_days, affected_entities)
            VALUES (domain_record.id, req->>'name', req->>'description', req->>'deadlineType', (req->>'standardPeriod')::INTEGER, (req->>'gracePeriod')::INTEGER, ARRAY(SELECT jsonb_array_elements_text(req->'affectedEntities')));
        END LOOP;
    END LOOP;
END;
$$;

-- Alter legal_domains table to remove old columns
ALTER TABLE legal_domains
DROP COLUMN IF EXISTS processing_rules,
DROP COLUMN IF EXISTS compliance_requirements; 