REVOKE EXECUTE ON FUNCTION public.generate_benefit_voucher(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_benefit_voucher(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_benefit_voucher(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_approved_benefit_partner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_benefit_voucher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_benefit_voucher(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_benefit_voucher(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_benefit_partner(uuid) TO authenticated;