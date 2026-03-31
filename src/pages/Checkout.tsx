import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePartner } from '@/contexts/PartnerContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CreditCard, QrCode, Loader2, Ticket, CheckCircle2, PartyPopper, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InputMask from 'react-input-mask';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CartItem {
  id: string;
  lead_id: string;
  leads: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
}

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  address: string;
  addressNumber: string;
  complement: string;
  postalCode: string;
  province: string;
  city: string;
}

export default function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    address: '',
    addressNumber: '',
    complement: '',
    postalCode: '',
    province: '',
    city: '',
  });
  
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState(false);
  const [voucherRedeemed, setVoucherRedeemed] = useState(false);
  const [selectedVoucherLeadId, setSelectedVoucherLeadId] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCart();
    loadUserData();
  }, [user, authLoading, navigate]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCustomerData(prev => ({
          ...prev,
          name: data.name || '',
          phone: data.phone || '',
          email: user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from('shopping_cart')
        .select(`
          id,
          lead_id,
          leads (
            id,
            name,
            description,
            price
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Carrinho vazio',
          description: 'Adicione leads ao carrinho primeiro',
          variant: 'destructive',
        });
        navigate('/cart');
        return;
      }

      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast({
        title: 'Erro ao carregar carrinho',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + Number(item.leads.price), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cnpj)) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  };

  const validateForm = (): boolean => {
    if (!customerData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!customerData.email.trim() || !customerData.email.includes('@')) {
      toast({ title: 'E-mail válido é obrigatório', variant: 'destructive' });
      return false;
    }
    
    const cpfCnpj = customerData.cpfCnpj.replace(/[^\d]/g, '');
    if (cpfCnpj.length === 11) {
      if (!validateCPF(cpfCnpj)) {
        toast({ title: 'CPF inválido', variant: 'destructive' });
        return false;
      }
    } else if (cpfCnpj.length === 14) {
      if (!validateCNPJ(cpfCnpj)) {
        toast({ title: 'CNPJ inválido', variant: 'destructive' });
        return false;
      }
    } else {
      toast({ title: 'CPF ou CNPJ é obrigatório', variant: 'destructive' });
      return false;
    }

    if (!customerData.phone.trim()) {
      toast({ title: 'Telefone é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!customerData.address.trim()) {
      toast({ title: 'Endereço é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!customerData.addressNumber.trim()) {
      toast({ title: 'Número do endereço é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!customerData.postalCode.trim()) {
      toast({ title: 'CEP é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!customerData.province.trim()) {
      toast({ title: 'Bairro é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!customerData.city.trim()) {
      toast({ title: 'Cidade é obrigatória', variant: 'destructive' });
      return false;
    }

    return true;
  };

  const handleVoucherRedeem = async () => {
    if (!voucherCode.trim()) {
      toast({ title: 'Informe o código do voucher', variant: 'destructive' });
      return;
    }

    const leadId = cartItems.length === 1 ? cartItems[0].lead_id : selectedVoucherLeadId;
    if (!leadId) {
      toast({ title: 'Selecione o lead para aplicar o voucher', variant: 'destructive' });
      return;
    }

    setVoucherLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-voucher', {
        body: {
          voucherCode: voucherCode.trim(),
          leadId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
        return;
      }

      const redeemedItem = cartItems.find(item => item.lead_id === leadId);
      const remaining = cartItems.filter(item => item.lead_id !== leadId);

      if (remaining.length === 0) {
        // Last item — show success modal
        setVoucherSuccess(true);
      } else {
        // Remove redeemed lead from cart state, continue checkout
        setCartItems(remaining);
        setVoucherRedeemed(true);
        toast({
          title: `Lead #${redeemedItem?.leads.id.slice(0, 8)} resgatado com voucher!`,
          description: 'Continue o checkout com os leads restantes.',
        });
      }
    } catch (error: any) {
      console.error('Voucher error:', error);
      toast({
        title: 'Erro ao validar voucher',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleCouponValidate = async () => {
    if (!couponCode.trim()) {
      toast({ title: 'Informe o código do cupom', variant: 'destructive' });
      return;
    }
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { couponCode: couponCode.trim() },
      });
      if (error) throw error;
      if (data.error) {
        toast({ title: data.error, variant: 'destructive' });
        return;
      }
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount_percent: data.discount_percent });
      toast({ title: `Cupom aplicado! ${data.discount_percent}% de desconto` });
    } catch (error: any) {
      toast({ title: 'Erro ao validar cupom', description: error.message, variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateDiscountedTotal = () => {
    const total = calculateTotal();
    if (!appliedCoupon) return total;
    return Math.round((total * (1 - appliedCoupon.discount_percent / 100)) * 100) / 100;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
          cartItems: cartItems.map(item => ({
            lead_id: item.lead_id,
            price: item.leads.price,
            name: item.leads.name,
            description: item.leads.description,
          })),
          customerData: {
            ...customerData,
            cpfCnpj: customerData.cpfCnpj.replace(/[^\d]/g, ''),
            phone: customerData.phone.replace(/[^\d]/g, ''),
            postalCode: customerData.postalCode.replace(/[^\d]/g, ''),
          },
        },
      });

      if (error) throw error;

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Erro ao processar pagamento',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };


  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto pb-8 md:pb-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Finalizar Compra</h1>

        {/* Voucher Section */}
        {!voucherRedeemed && (
        <Card className="mb-6 border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Voucher de Lead
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Possui um voucher? Insira o código abaixo para resgatar seu lead gratuitamente.
            </p>
            {cartItems.length > 1 && (
              <div className="mb-3">
                <Label className="text-sm mb-1 block">Selecione o lead para aplicar o voucher:</Label>
                <Select value={selectedVoucherLeadId} onValueChange={setSelectedVoucherLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {cartItems.map((item) => (
                      <SelectItem key={item.lead_id} value={item.lead_id}>
                        Lead #{item.leads.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3">
              <Input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="EX: LEADGRATIS2026"
                className="flex-1"
              />
              <Button
                onClick={handleVoucherRedeem}
                disabled={voucherLoading || (cartItems.length > 1 && !selectedVoucherLeadId)}
                variant="outline"
              >
                {voucherLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Validar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Coupon Section */}
        <Card className="mb-6 border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Cupom de Desconto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appliedCoupon ? (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cupom <strong>{appliedCoupon.code}</strong> aplicado — {appliedCoupon.discount_percent}% de desconto!</span>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}>
                  Remover
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Possui um cupom de desconto? Insira o código abaixo.
                </p>
                <div className="flex gap-3">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="EX: DESCONTO20"
                    className="flex-1"
                  />
                  <Button onClick={handleCouponValidate} disabled={couponLoading} variant="outline">
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Voucher Success Dialog */}
        <Dialog open={voucherSuccess} onOpenChange={() => {}}>
          <DialogContent className="text-center max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-primary/10 rounded-full p-4">
                <PartyPopper className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Parabéns! 🎉</h2>
              <p className="text-muted-foreground">
                Você resgatou seu lead gratuitamente com o voucher{' '}
                <strong>{voucherCode}</strong>!
              </p>
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-4 py-2">
                <CheckCircle2 className="h-4 w-4" />
                Lead adicionado aos seus leads
              </div>
              <Button
                onClick={() => navigate('/my-leads')}
                className="w-full mt-2"
                size="lg"
              >
                Ir para Meus Leads
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-medium">Lead #{item.leads.id.slice(0, 8)}</p>
                  </div>
                  <p className="font-semibold whitespace-nowrap">
                    {formatPrice(item.leads.price)}
                  </p>
                </div>
              ))}
              <div className="pt-3 border-t space-y-1">
                {appliedCoupon && (
                  <>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span className="line-through">{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-primary">
                      <span>Desconto ({appliedCoupon.discount_percent}%):</span>
                      <span>-{formatPrice(calculateTotal() * appliedCoupon.discount_percent / 100)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(calculateDiscountedTotal())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'PIX' | 'CREDIT_CARD')}
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="PIX" id="pix" />
                  <Label htmlFor="pix" className="flex items-center cursor-pointer flex-1">
                    <QrCode className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-sm text-muted-foreground">
                        Pagamento instantâneo
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="CREDIT_CARD" id="card" />
                  <Label htmlFor="card" className="flex items-center cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-muted-foreground">
                        Parcelamento disponível
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="João da Silva"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="joao@email.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cpfCnpj">CPF ou CNPJ *</Label>
                <InputMask
                  mask={customerData.cpfCnpj.replace(/[^\d]/g, '').length <= 11 ? '999.999.999-99' : '99.999.999/9999-99'}
                  value={customerData.cpfCnpj}
                  onChange={(e) => setCustomerData({ ...customerData, cpfCnpj: e.target.value })}
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="cpfCnpj"
                      placeholder="000.000.000-00"
                      className="mt-1"
                    />
                  )}
                </InputMask>
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <InputMask
                  mask="(99) 99999-9999"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="phone"
                      placeholder="(31) 99999-9999"
                      className="mt-1"
                    />
                  )}
                </InputMask>
              </div>

              <div>
                <Label htmlFor="postalCode">CEP *</Label>
                <InputMask
                  mask="99999-999"
                  value={customerData.postalCode}
                  onChange={(e) => setCustomerData({ ...customerData, postalCode: e.target.value })}
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="postalCode"
                      placeholder="00000-000"
                      className="mt-1"
                    />
                  )}
                </InputMask>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  value={customerData.address}
                  onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                  placeholder="Rua, Avenida, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="addressNumber">Número *</Label>
                <Input
                  id="addressNumber"
                  value={customerData.addressNumber}
                  onChange={(e) => setCustomerData({ ...customerData, addressNumber: e.target.value })}
                  placeholder="100"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={customerData.complement}
                  onChange={(e) => setCustomerData({ ...customerData, complement: e.target.value })}
                  placeholder="Apto, Bloco, etc."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="province">Bairro *</Label>
                <Input
                  id="province"
                  value={customerData.province}
                  onChange={(e) => setCustomerData({ ...customerData, province: e.target.value })}
                  placeholder="Centro"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={customerData.city}
                  onChange={(e) => setCustomerData({ ...customerData, city: e.target.value })}
                  placeholder="São Paulo"
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={processing}
              className="w-full mt-6"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando pagamento...
                </>
              ) : (
                'Finalizar Compra'
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              * Campos obrigatórios
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
