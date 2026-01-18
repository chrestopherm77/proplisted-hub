-- Remove a política incorreta
DROP POLICY IF EXISTS "Allow anonymous insert" ON lead_submissions;

-- Cria a política correta para usuários anônimos
CREATE POLICY "Allow anonymous insert" ON lead_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

-- Também corrigir a política na tabela leads
DROP POLICY IF EXISTS "Allow public insert from form" ON leads;

CREATE POLICY "Allow public insert from form" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);