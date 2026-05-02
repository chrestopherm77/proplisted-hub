import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BrandLogo } from '@/components/BrandLogo';
import { SimpleSignup } from '@/components/auth/SimpleSignup';

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const refFromUrl = (searchParams.get('ref') || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  const planFromUrl = (searchParams.get('plan') || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);

  useEffect(() => {
    if (planFromUrl) {
      import('@/lib/pendingPlan').then(({ setPendingPlan }) => setPendingPlan(planFromUrl));
    }
  }, [planFromUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <BrandLogo size="lg" />
        </div>
        <SimpleSignup
          onSwitchToLogin={() => navigate('/auth')}
          initialReferralCode={refFromUrl}
        />
      </div>
    </div>
  );
}
