import { useState } from 'react';
import type { ReactNode } from 'react';
import { App, Spin } from 'antd';
import { ProForm, type ProFormInstance } from '@ant-design/pro-components';
import { ActionBar } from '../ActionBar';
import { AdminEmptyState } from '../AdminEmptyState';
import { AdminButton } from '../AdminPrimitives';
import { FormPage } from '../FormPage';
import { PageShell } from '../PageShell';
import { SectionTitle } from '../SectionTitle';
import './index.css';

type TemplateFormPageProps<T extends Record<string, unknown>> = {
  title: string;
  formId: string;
  form?: ProFormInstance<T>;
  initialValues?: Partial<T>;
  loading?: boolean;
  submitting?: boolean;
  error?: ReactNode;
  notFound?: boolean;
  onRetry?: () => void;
  titleExtra?: ReactNode;
  children: ReactNode;
  onSubmit: (values: T) => Promise<void> | void;
  onSubmitError?: (error: unknown, form: ProFormInstance<T>) => boolean | void;
  onCancel: () => void;
};

type TemplateFormSectionProps = {
  title: string;
  children: ReactNode;
};

export function TemplateFormPage<T extends Record<string, unknown>>({
  title,
  formId,
  form,
  initialValues,
  loading,
  submitting,
  error,
  notFound,
  onRetry,
  titleExtra,
  children,
  onSubmit,
  onSubmitError,
  onCancel
}: TemplateFormPageProps<T>) {
  const { message } = App.useApp();
  const [innerForm] = ProForm.useForm<T>();
  const formInstance = form || innerForm;
  const [innerSubmitting, setInnerSubmitting] = useState(false);

  const isUnavailable = Boolean(error) || Boolean(notFound);
  const isSubmitting = Boolean(submitting || innerSubmitting);

  const handleSubmit = async (values: T) => {
    try {
      setInnerSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      const handled = onSubmitError?.(error, formInstance);
      if (!handled) {
        message.error(error instanceof Error ? error.message : '保存失败');
      }
    } finally {
      setInnerSubmitting(false);
    }
  };

  return (
    <PageShell
      title={title}
      compact
      titleExtra={titleExtra}
      actions={(
        <ActionBar>
          <AdminButton disabled={isSubmitting} onClick={onCancel}>取消</AdminButton>
          {!isUnavailable ? (
            <AdminButton type="primary" htmlType="submit" form={formId} loading={isSubmitting}>保存</AdminButton>
          ) : null}
        </ActionBar>
      )}
    >
      <Spin spinning={Boolean(loading)}>
        {isUnavailable ? (
          <div className="admin-template-form-page__state">
            <AdminEmptyState description={notFound ? '记录不存在或已被删除' : error}>
              {onRetry ? <AdminButton type="primary" onClick={onRetry}>重新加载</AdminButton> : null}
            </AdminEmptyState>
          </div>
        ) : (
          <FormPage<T>
            id={formId}
            form={formInstance}
            initialValues={initialValues}
            showActions={false}
            onCancel={onCancel}
            onSubmit={handleSubmit}
          >
            <div className="admin-template-form-page">
              {children}
            </div>
          </FormPage>
        )}
      </Spin>
    </PageShell>
  );
}

export function TemplateFormSection({ title, children }: TemplateFormSectionProps) {
  return (
    <section className="admin-template-form-page__panel">
      <SectionTitle title={title} />
      {children}
    </section>
  );
}
