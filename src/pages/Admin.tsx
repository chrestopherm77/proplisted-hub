import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { LeadsManagement } from '@/components/admin/LeadsManagement';
import { LeadTracking } from '@/components/admin/LeadTracking';
import { PurchasesOverview } from '@/components/admin/PurchasesOverview';
import { LeadPurchasesOverview } from '@/components/admin/LeadPurchasesOverview';
import { SubscriptionsManagement } from '@/components/admin/SubscriptionsManagement';
import { PendingPaymentsManagement } from '@/components/admin/PendingPaymentsManagement';
import { VouchersManagement } from '@/components/admin/VouchersManagement';
import { UsersManagement } from '@/components/admin/UsersManagement';
import { AccessHistory } from '@/components/admin/AccessHistory';
import { PartnersManagement } from '@/components/admin/PartnersManagement';
import { CreativeStylesManagement } from '@/components/admin/CreativeStylesManagement';

type Section =
  | 'dashboard'
  | 'leads'
  | 'tracking'
  | 'purchases'
  | 'lead-purchases'
  | 'subscriptions'
  | 'pending'
  | 'vouchers'
  | 'users'
  | 'access'
  | 'partners'
  | 'creatives';

const COMPONENTS: Record<Section, React.ComponentType> = {
  dashboard: DashboardStats,
  leads: LeadsManagement,
  tracking: LeadTracking,
  purchases: PurchasesOverview,
  'lead-purchases': LeadPurchasesOverview,
  subscriptions: SubscriptionsManagement,
  pending: PendingPaymentsManagement,
  vouchers: VouchersManagement,
  users: UsersManagement,
  access: AccessHistory,
  partners: PartnersManagement,
  creatives: CreativeStylesManagement,
};

export default function AdminPage({ section = 'dashboard' }: { section?: Section }) {
  const Component = COMPONENTS[section];
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}
