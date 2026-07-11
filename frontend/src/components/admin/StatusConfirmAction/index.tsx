import type { ReactNode } from 'react';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ConfirmAction, type ConfirmActionProps } from '../ConfirmAction';
import './index.css';

type StatusConfirmActionProps = Omit<ConfirmActionProps, 'title' | 'description' | 'okText'> & {
  action: 'enable' | 'disable';
  entityName?: string;
  targetName?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
};

function getActionText(action: StatusConfirmActionProps['action']) {
  return action === 'enable' ? '启用' : '停用';
}

function renderTitle(action: StatusConfirmActionProps['action'], entityName?: string) {
  const actionText = getActionText(action);
  const Icon = action === 'enable' ? CheckCircleOutlined : ExclamationCircleOutlined;

  return (
    <span className={`admin-status-confirm-action__title is-${action}`}>
      <Icon />
      <span>确认{actionText}{entityName || ''}</span>
    </span>
  );
}

function renderDescription(action: StatusConfirmActionProps['action'], entityName?: string, targetName?: ReactNode) {
  const actionText = getActionText(action);

  if (action === 'disable') {
    return (
      <div className="admin-confirm-action__danger-content">
        <div>
          {targetName ? `将${actionText}${entityName || '记录'} ` : `将${actionText}该记录。`}
          {targetName ? <strong>{targetName}</strong> : null}
          {targetName ? '。' : null}
        </div>
        <div className="admin-confirm-action__danger-risk">
          停用后将暂不可用，请谨慎操作。
        </div>
      </div>
    );
  }

  return (
    <>
      {targetName ? `${actionText}后，${entityName || '记录'} ` : ''}
      {targetName ? <strong>{targetName}</strong> : null}
      {targetName ? ' 将恢复可用。' : '启用后，该记录将恢复可用。'}
    </>
  );
}

export function StatusConfirmAction({
  action,
  entityName,
  targetName,
  title,
  description,
  children,
  danger,
  ...props
}: StatusConfirmActionProps) {
  const actionText = getActionText(action);

  return (
    <ConfirmAction
      {...props}
      danger={danger ?? action === 'disable'}
      okText={actionText}
      title={title || renderTitle(action, entityName)}
      description={description || renderDescription(action, entityName, targetName)}
    >
      {children}
    </ConfirmAction>
  );
}
