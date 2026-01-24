import { useState, useEffect } from 'react';
import { User, CheckCircle } from 'lucide-react';

const names = [
  'Gabriel', 'Marina', 'Carlos', 'Fernanda', 'Ricardo', 
  'Juliana', 'Pedro', 'Ana', 'Lucas', 'Beatriz',
  'Rafael', 'Camila', 'Bruno', 'Larissa', 'Thiago'
];

const actions = [
  'agendou uma visita com um lead',
  'fechou um negócio através de um lead',
  'comprou 3 leads para sua região',
  'iniciou negociação com um lead',
  'acabou de comprar um lead premium',
  'adquiriu leads exclusivos',
  'fechou uma venda com um lead',
];

const times = [
  'há 1 hora',
  'há 2 horas', 
  'há 3 horas',
  'nas últimas 4 horas',
  'há 5 horas',
  'há poucos minutos',
  'recentemente'
];

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInterval = () => Math.floor(Math.random() * 4000) + 8000; // 8-12 seconds

const FakeNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [notification, setNotification] = useState({ name: '', action: '', time: '' });

  useEffect(() => {
    const showNotification = () => {
      setNotification({
        name: getRandomItem(names),
        action: getRandomItem(actions),
        time: getRandomItem(times),
      });
      setIsVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Initial delay before first notification
    const initialTimeout = setTimeout(() => {
      showNotification();
    }, 3000);

    // Set up recurring notifications
    const interval = setInterval(() => {
      showNotification();
    }, getRandomInterval() + 4000); // Add 4s for the display time

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 max-w-sm bg-card border border-border rounded-lg shadow-lg p-4 
        transition-all duration-300 ease-out
        ${isVisible ? 'animate-fade-in opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{notification.name}</span>{' '}
            {notification.action}
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-success" />
            {notification.time}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FakeNotification;
