import './index.css';

type AdminFloatingAssistantProps = {
  onClick?: () => void;
};

export function AdminFloatingAssistant({ onClick }: AdminFloatingAssistantProps) {
  return (
    <button
      className="admin-floating-assistant"
      type="button"
      aria-label="AI 助手入口"
      title="AI 助手入口"
      onClick={onClick}
    >
      <span className="admin-floating-assistant__halo" />
      <span className="admin-floating-assistant__sprite" aria-hidden="true" />
    </button>
  );
}
