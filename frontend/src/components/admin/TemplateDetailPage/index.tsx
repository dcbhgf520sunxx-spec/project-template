import type { ReactNode } from 'react';
import { ActionBar } from '../ActionBar';
import { AdminEmptyState } from '../AdminEmptyState';
import { AdminButton } from '../AdminPrimitives';
import type { DetailMetaItem } from '../DetailMetaList';
import { DetailMetaList } from '../DetailMetaList';
import { PageShell } from '../PageShell';
import { SectionTitle } from '../SectionTitle';
import './index.css';

type TemplateDetailSideSection = {
  title?: string;
  items?: DetailMetaItem[];
  columns?: 2 | 3 | 4;
  children?: ReactNode;
};

type TemplateDetailPageProps = {
  title: string;
  loading?: boolean;
  error?: ReactNode;
  notFound?: boolean;
  onRetry?: () => void;
  onBack?: () => void;
  backText?: string;
  titleTags?: ReactNode;
  titleCenter?: ReactNode;
  actions?: ReactNode;
  statusSection?: TemplateDetailSideSection | null;
  statusAction?: ReactNode;
  documentSection?: TemplateDetailSideSection | null;
  aside?: ReactNode;
  children: ReactNode;
};

type TemplateDetailSectionProps = {
  title: string;
  inlineExtra?: ReactNode;
  children: ReactNode;
};

export function TemplateDetailPage({
  title,
  loading,
  error,
  notFound,
  onRetry,
  onBack,
  backText = '返回列表',
  titleTags,
  titleCenter,
  actions,
  statusSection,
  statusAction,
  documentSection,
  aside,
  children
}: TemplateDetailPageProps) {
  const isUnavailable = Boolean(error) || Boolean(notFound);
  const standardAside = statusSection || documentSection ? (
    <>
      {statusSection ? <TemplateDetailSideSection section={statusSection} defaultTitle="当前状态" action={statusAction} /> : null}
      {documentSection ? <TemplateDetailSideSection section={documentSection} defaultTitle="单据信息" /> : null}
      {aside}
    </>
  ) : aside;
  const headerActions = onBack || actions ? (
    <ActionBar>
      {onBack ? <AdminButton onClick={onBack}>{backText}</AdminButton> : null}
      {!isUnavailable ? actions : null}
    </ActionBar>
  ) : null;

  return (
    <PageShell title={title} compact titleExtra={titleTags} titleCenter={titleCenter} actions={headerActions} loading={loading}>
      {isUnavailable ? (
        <div className="admin-template-detail-page__state">
          <AdminEmptyState description={notFound ? '记录不存在或已被删除' : error}>
            {onRetry ? <AdminButton type="primary" onClick={onRetry}>重新加载</AdminButton> : null}
          </AdminEmptyState>
        </div>
      ) : (
        <div className={standardAside ? 'admin-template-detail-page' : 'admin-template-detail-page is-single'}>
          <div className="admin-template-detail-page__main">
            {children}
          </div>
          {standardAside ? <aside className="admin-template-detail-page__aside">{standardAside}</aside> : null}
        </div>
      )}
    </PageShell>
  );
}

export function TemplateDetailSection({ title, inlineExtra, children }: TemplateDetailSectionProps) {
  return (
    <section className="admin-template-detail-page__panel">
      <SectionTitle title={title} inlineExtra={inlineExtra} />
      {children}
    </section>
  );
}

function TemplateDetailSideSection({
  section,
  defaultTitle,
  action
}: {
  section: TemplateDetailSideSection;
  defaultTitle: string;
  action?: ReactNode;
}) {
  return (
    <TemplateDetailSection title={section.title || defaultTitle}>
      {section.children || (
        <DetailMetaList
          columns={section.columns || 2}
          items={section.items || []}
        />
      )}
      {action ? <div className="admin-template-detail-page__status-action">{action}</div> : null}
    </TemplateDetailSection>
  );
}
