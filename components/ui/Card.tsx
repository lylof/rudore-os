import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  noPadding = false,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-rudore-panel 
        border border-rudore-border 
        transition-all duration-300 ease-in-out
        ${onClick ? 'cursor-pointer hover:border-rudore-orange/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]' : ''}
        flex flex-col
        ${className}
      `}
    >
      {(title || subtitle || action) && (
        <div className="flex justify-between items-start p-6 border-b border-rudore-border/50">
          <div>
            {title && (
              <h3 className="font-header uppercase tracking-widest text-rudore-light font-bold text-sm">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-rudore-text text-xs mt-1 font-mono">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};

export const Badge: React.FC<{ status: string; onClick?: () => void }> = ({ status, onClick }) => {
  let colorClass = 'bg-rudore-sidebar text-rudore-text/60 border-rudore-border';

  // Update cases to match French Status enum values (lowercased)
  switch (status.toLowerCase()) {
    case 'croissance':
    case 'actif':
      colorClass = 'bg-rudore-success/10 text-rudore-success border-rudore-success/30';
      break;
    case 'développement':
      colorClass = 'bg-rudore-warning/10 text-rudore-warning border-rudore-warning/30';
      break;
    case 'mvp':
      colorClass = 'bg-rudore-info/10 text-rudore-info border-rudore-info/30';
      break;
    case 'planification':
      colorClass = 'bg-rudore-orange/10 text-rudore-orange border-rudore-orange/30';
      break;
  }

  return (
    <span
      onClick={onClick}
      className={`
        px-2 py-1 text-[10px] uppercase tracking-wider font-bold border badge-rounded transition-all
        ${colorClass}
        ${onClick ? 'cursor-pointer hover:brightness-110 hover:shadow-sm' : ''}
      `}
    >
      {status}
    </span>
  );
};