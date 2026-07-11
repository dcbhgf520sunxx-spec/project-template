import type { ComponentProps, ReactNode } from 'react';
import { AdminDrawer } from '../AdminDrawer';
import { AdminParagraph } from '../AdminPrimitives';
import { TemplateListPage } from '../TemplateListPage';
import type { TemplateListPageProps } from '../TemplateListPage';
import './index.css';

export type TemplateDrawerTableProps<
  T extends Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>
> = Omit<ComponentProps<typeof AdminDrawer>, 'children'> & {
  description?: ReactNode;
  list: TemplateListPageProps<T, P>;
};

export function TemplateDrawerTable<
  T extends Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>
>({ description, list, className, rootClassName, ...drawerProps }: TemplateDrawerTableProps<T, P>) {
  return (
    <AdminDrawer
      {...drawerProps}
      rootClassName={['admin-template-drawer-table-root', rootClassName].filter(Boolean).join(' ')}
      className={['admin-template-drawer-table', className].filter(Boolean).join(' ')}
    >
      {description ? (
        <AdminParagraph className="admin-template-drawer-table__description">
          {description}
        </AdminParagraph>
      ) : null}
      <div className="admin-template-drawer-table__content">
        <TemplateListPage<T, P> {...list} embedded />
      </div>
    </AdminDrawer>
  );
}
