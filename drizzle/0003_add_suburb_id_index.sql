-- Add index on suburb_id for efficient suburb-based agent lookups
CREATE INDEX IF NOT EXISTS agent_suburbs_suburb_id_idx ON agent_suburbs(suburb_id);

-- Add composite index for property type filtering
CREATE INDEX IF NOT EXISTS sales_property_type_agent_idx ON sales(property_type, agent_id);
