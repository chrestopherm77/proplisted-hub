import { MessageCircle } from 'lucide-react';

export function WhatsAppFab({ phone }: { phone?: string }) {
  if (!phone) return null;
  const num = String(phone).replace(/\D/g, '');
  return (
    <a
      href={`https://wa.me/${num}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-xl z-50"
      aria-label="Conversar no WhatsApp"
    >
      <MessageCircle className="h-7 w-7 fill-white" />
    </a>
  );
}
