import { UserRound } from "lucide-react";

function getInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function FriendCard({ name, subtitle, description, badge, actions }) {
  const initials = getInitials(name);

  return (
    <article className="friend-card">
      <div className="friend-card__head">
        <div className="friend-card__avatar" aria-hidden="true">
          {initials ? <span>{initials}</span> : <UserRound size={18} />}
        </div>

        <div className="friend-card__copy">
          <strong>{name}</strong>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>

        {badge ? <span className="tag">{badge}</span> : null}
      </div>

      {description ? <p className="friend-card__description">{description}</p> : null}

      {actions ? <div className="friend-card__actions">{actions}</div> : null}
    </article>
  );
}

export default FriendCard;
