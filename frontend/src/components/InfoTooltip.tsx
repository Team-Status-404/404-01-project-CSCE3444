import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

interface InfoTooltipProps {
  content: string;
  id?: string;
}

// Subtle ⓘ icon that triggers a Tippy tooltip on hover (desktop) and tap (mobile).
// Uses placement="auto" so Tippy picks the best direction and never clips off-screen (FR-27).
export default function InfoTooltip({ content, id }: InfoTooltipProps) {
  return (
    <Tippy
      content={content}
      placement="auto"
      maxWidth={260}
      touch={true}
      theme="stockiq"
    >
      <span
        id={id}
        role="img"
        aria-label="More information"
        tabIndex={0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1.5px solid #64748b',
          color: '#64748b',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'help',
          lineHeight: 1,
          userSelect: 'none',
          flexShrink: 0,
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#38bdf8';
          e.currentTarget.style.color = '#38bdf8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#64748b';
          e.currentTarget.style.color = '#64748b';
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#38bdf8';
          e.currentTarget.style.color = '#38bdf8';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#64748b';
          e.currentTarget.style.color = '#64748b';
        }}
      >
        i
      </span>
    </Tippy>
  );
}
