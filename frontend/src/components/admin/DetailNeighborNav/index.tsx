import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { AdminButton, AdminText } from '../AdminPrimitives';
import './index.css';

export type DetailNeighborNavProps = {
  loading?: boolean;
  prevId?: string | number | null;
  nextId?: string | number | null;
  ordinal?: number;
  total?: number;
  placement?: 'content' | 'title';
  onNavigate: (id: string | number) => void;
};

export function DetailNeighborNav({
  loading,
  prevId,
  nextId,
  ordinal,
  total,
  placement = 'content',
  onNavigate
}: DetailNeighborNavProps) {
  const hasPosition = Boolean(total && ordinal);

  return (
    <div className={placement === 'title' ? 'admin-detail-neighbor-nav is-title' : 'admin-detail-neighbor-nav'}>
      <AdminButton
        size="small"
        icon={<LeftOutlined />}
        aria-label="上一条"
        title="上一条"
        disabled={!prevId || loading}
        onClick={() => prevId && onNavigate(prevId)}
      />
      <AdminText type="secondary" className="admin-detail-neighbor-nav__position">
        {loading ? '— / —' : hasPosition ? `${ordinal} / ${total}` : '— / —'}
      </AdminText>
      <AdminButton
        size="small"
        icon={<RightOutlined />}
        aria-label="下一条"
        title="下一条"
        disabled={!nextId || loading}
        onClick={() => nextId && onNavigate(nextId)}
      />
    </div>
  );
}
