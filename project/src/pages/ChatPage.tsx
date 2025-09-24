import { ChatbotWidget } from '../components/ChatbotWidget';

export function ChatPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text mb-4">Chat Assistant</h2>
        <p className="text-text-muted mb-6">
          The chat panel is available via the floating action button or by clicking below.
        </p>
        <ChatbotWidget isOpen={true} onToggle={() => {}} />
      </div>
    </div>
  );
}