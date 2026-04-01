import { Inbox } from "lucide-react";

function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="empty-state__copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default EmptyState;
