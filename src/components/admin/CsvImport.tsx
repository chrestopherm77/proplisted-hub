import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CsvLead {
  name: string;
  phone: string;
  description: string;
  price: number;
  max_purchases?: number;
}

interface ImportResult {
  success: number;
  errors: string[];
}

interface CsvImportProps {
  onImportComplete: () => void;
}

export function CsvImport({ onImportComplete }: CsvImportProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = ['name', 'phone', 'description', 'price', 'max_purchases'];
    const exampleRows = [
      ['João Silva', '11999998888', 'Interessado em apartamento até R$500.000 na zona sul', '25.00', '3'],
      ['Maria Santos', '11988887777', 'Procura casa com 3 quartos em condomínio fechado', '30.00', '3'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_leads.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): CsvLead[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV deve ter pelo menos o cabeçalho e uma linha de dados');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredHeaders = ['name', 'phone', 'description', 'price'];
    
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        throw new Error(`Coluna obrigatória "${required}" não encontrada no CSV`);
      }
    }

    const leads: CsvLead[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parse CSV line handling quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/"/g, '') || '';
      });

      const price = parseFloat(row.price?.replace(',', '.') || '0');
      if (isNaN(price) || price <= 0) {
        throw new Error(`Linha ${i + 1}: preço inválido "${row.price}"`);
      }

      if (!row.name?.trim()) {
        throw new Error(`Linha ${i + 1}: nome é obrigatório`);
      }

      if (!row.phone?.trim()) {
        throw new Error(`Linha ${i + 1}: telefone é obrigatório`);
      }

      if (!row.description?.trim()) {
        throw new Error(`Linha ${i + 1}: descrição é obrigatória`);
      }

      leads.push({
        name: row.name.trim(),
        phone: row.phone.trim(),
        description: row.description.trim(),
        price,
        max_purchases: row.max_purchases ? parseInt(row.max_purchases) : 3,
      });
    }

    return leads;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const leads = parseCSV(text);

      if (leads.length === 0) {
        throw new Error('Nenhum lead válido encontrado no CSV');
      }

      const importResult: ImportResult = { success: 0, errors: [] };

      // Import in batches of 50
      const batchSize = 50;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize).map(lead => ({
          name: lead.name,
          phone: lead.phone,
          description: lead.description,
          price: lead.price,
          max_purchases: lead.max_purchases || 3,
          is_active: true,
          purchase_count: 0,
        }));

        const { error } = await supabase.from('leads').insert(batch);

        if (error) {
          importResult.errors.push(`Erro no lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          importResult.success += batch.length;
        }
      }

      setResult(importResult);

      if (importResult.success > 0) {
        toast({
          title: 'Importação concluída!',
          description: `${importResult.success} leads importados com sucesso`,
        });
        onImportComplete();
      }
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive',
      });
      setResult({ success: 0, errors: [error.message] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Importação em Massa (CSV)
        </CardTitle>
        <CardDescription className="text-xs">
          Importe múltiplos leads de uma vez usando um arquivo CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Modelo CSV
          </Button>
          
          <div className="flex-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={importing}
              className="hidden"
              id="csv-upload"
            />
            <Button
              variant="default"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Importando...' : 'Importar CSV'}
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Colunas obrigatórias:</strong> name, phone, description, price</p>
          <p><strong>Coluna opcional:</strong> max_purchases (padrão: 3)</p>
          <p className="text-amber-600 dark:text-amber-400">
            ⚠️ Na vitrine, apenas a descrição e o preço são exibidos. Nome e telefone são liberados após a compra.
          </p>
        </div>

        {result && (
          <div className="space-y-2">
            {result.success > 0 && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {result.success} leads importados com sucesso!
                </AlertDescription>
              </Alert>
            )}
            
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-xs">
                    {result.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
