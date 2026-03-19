import { Link } from 'react-router-dom';

type TopBarProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionTo?: string;
};

export default function TopBar({ title, subtitle, actionLabel, actionTo }: TopBarProps) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="primary-button">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
