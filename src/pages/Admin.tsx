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
import { LaunchAccessManagement } from '@/components/admin/LaunchAccessManagement';
import { LandingPagesManagement } from '@/components/admin/LandingPagesManagement';
import { LandingPageEditor } from '@/components/admin/LandingPageEditor';
import { HomePageEditor } from '@/components/admin/home-page/HomePageEditor';
import { OnboardingVideoManagement } from '@/components/admin/OnboardingVideoManagement';
import { PublicVideosManagement } from '@/components/admin/PublicVideosManagement';
import { SupportManagement } from '@/components/admin/SupportManagement';
import { WhatsappCityGroupsManagement } from '@/components/admin/WhatsappCityGroupsManagement';
import { SignupProgressManagement } from '@/components/admin/SignupProgressManagement';
import { UserActivityLog } from '@/components/admin/UserActivityLog';
import { AffiliatesManagement } from '@/components/admin/AffiliatesManagement';
import { BrokerPortalsManagement } from '@/components/admin/BrokerPortalsManagement';
import { BrokerPortalRequests } from '@/components/admin/BrokerPortalRequests';
import { EmailMarketingManagement } from '@/components/admin/EmailMarketingManagement';
import { FaqManagement } from '@/components/admin/FaqManagement';
import { AlertBannersManagement } from '@/components/admin/AlertBannersManagement';

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
  | 'launch-access'
  | 'partners'
  | 'creatives'
  | 'landing-pages'
  | 'landing-page-editor'
  | 'home-page'
  | 'onboarding-video'
  | 'public-videos'
  | 'support'
  | 'whatsapp-groups'
  | 'signup-progress'
  | 'user-activity'
  | 'affiliates'
  | 'broker-portals'
  | 'broker-portal-requests'
  | 'email-marketing'
  | 'faq'
  | 'alert-banners';

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
  'launch-access': LaunchAccessManagement,
  partners: PartnersManagement,
  creatives: CreativeStylesManagement,
  'landing-pages': LandingPagesManagement,
  'landing-page-editor': LandingPageEditor,
  'home-page': HomePageEditor,
  'onboarding-video': OnboardingVideoManagement,
  'public-videos': PublicVideosManagement,
  support: SupportManagement,
  'whatsapp-groups': WhatsappCityGroupsManagement,
  'signup-progress': SignupProgressManagement,
  'user-activity': UserActivityLog,
  affiliates: AffiliatesManagement,
  'broker-portals': BrokerPortalsManagement,
  'broker-portal-requests': BrokerPortalRequests,
  'email-marketing': EmailMarketingManagement,
  faq: FaqManagement,
  'alert-banners': AlertBannersManagement,
};

export default function AdminPage({ section = 'dashboard' }: { section?: Section }) {
  const Component = COMPONENTS[section];
  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}
