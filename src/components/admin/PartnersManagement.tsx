import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Globe, Palette, Loader2 } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at: string;
}

interface PartnerForm {
  name: string;
  slug: string;
  custom_domain: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
}

const emptyForm: PartnerForm = {
  name: '',
  slug: '',
  custom_domain: '',
  logo_url: '',
  primary_color: '#1e40af',
  secondary_color: '#3b82f6',
  is_active: true,
};

export function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [salesCount, setSalesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPartners(data as Partner[]);

      // Fetch sales count per partner
      const { data: purchases } = await supabase
        .from('purchases')
        .select('partner_id')
        .not('partner_id', 'is', null)
        .eq('status', 'PAID');

      if (purchases) {
        const counts: Record<string, number> = {};
        purchases.forEach((p: any) => {
          counts[p.partner_id] = (counts[p.partner_id] || 0) + 1;
        });
        setSalesCount(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (partner: Partner) => {
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      slug: partner.slug,
      custom_domain: partner.custom_domain || '',
      logo_url: partner.logo_url || '',
      primary_color: partner.primary_color,
      secondary_color: partner.secondary_color,
      is_active: partner.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'Nome e slug são obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      custom_domain: form.custom_domain.trim() || null,
      logo_url: form.logo_url.trim() || null,
      primary_color: form.primary_color,
      secondary_color: form.secondary_color,
      is_active: form.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('partners').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('partners').insert(payload));
    }

    if (error) {
      toast({ title: 'Erro ao salvar parceiro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Parceiro atualizado!' : 'Parceiro criado!' });
      setDialogOpen(false);
      fetchPartners();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Parceiros White-Label</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo Parceiro
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Cores</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum parceiro cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.name}</TableCell>
                    <TableCell className="text-muted-foreground">{partner.slug}</TableCell>
                    <TableCell>
                      {partner.custom_domain ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Globe className="h-3 w-3" />
                          {partner.custom_domain}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <div
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: partner.primary_color }}
                          title={partner.primary_color}
                        />
                        <div
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: partner.secondary_color }}
                          title={partner.secondary_color}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{salesCount[partner.id] || 0}</TableCell>
                    <TableCell>
                      <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                        {partner.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(partner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do parceiro" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="parceiro-nome"
              />
              <p className="text-xs text-muted-foreground mt-1">Identificador único (apenas letras, números e hífens)</p>
            </div>
            <div>
              <Label>Domínio Customizado</Label>
              <Input value={form.custom_domain} onChange={(e) => setForm({ ...form, custom_domain: e.target.value })} placeholder="leads.parceiro.com" />
            </div>
            <div>
              <Label>URL do Logo</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Cor Primária</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-8 w-10 cursor-pointer" />
                  <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Palette className="h-3 w-3" /> Cor Secundária</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-8 w-10 cursor-pointer" />
                  <Input value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Ativo</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? 'Salvar Alterações' : 'Criar Parceiro'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
