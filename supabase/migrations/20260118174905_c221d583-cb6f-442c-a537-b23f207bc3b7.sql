-- Add form_data column to store all form responses
ALTER TABLE leads ADD COLUMN form_data JSONB;

-- Add reference to lead_submissions
ALTER TABLE leads ADD COLUMN lead_submission_id UUID REFERENCES lead_submissions(id);

-- Create policy to allow public insert from form (anonymous users submitting the form)
CREATE POLICY "Allow public insert from form" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);