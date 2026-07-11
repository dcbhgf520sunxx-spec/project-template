import { Children } from 'react';
import type { ReactNode } from 'react';
import { Popover } from 'antd';
import { AdminTextAction } from '../AdminTextAction';
import { TableActions } from '../TableActions';
import './index.css';

type OperationColumnActionsProps = {
  children: ReactNode;
  collapseThreshold?: number;
  visibleCountWhenCollapsed?: number;
};

export function OperationColumnActions({
  children,
  collapseThreshold = 4,
  visibleCountWhenCollapsed = 2
}: OperationColumnActionsProps) {
  const actions = Children.toArray(children).filter(Boolean);
  const shouldCollapse = actions.length >= collapseThreshold;
  const visibleActions = shouldCollapse ? actions.slice(0, visibleCountWhenCollapsed) : actions;
  const overflowActions = shouldCollapse ? actions.slice(visibleCountWhenCollapsed) : [];

  return (
    <TableActions>
      {visibleActions}
      {shouldCollapse ? (
        <Popover
          trigger="click"
          placement="bottomRight"
          arrow={false}
          overlayClassName="admin-operation-column-actions__popover"
          content={(
            <div className="admin-operation-column-actions__more">
              {overflowActions}
            </div>
          )}
        >
          <AdminTextAction>更多</AdminTextAction>
        </Popover>
      ) : null}
    </TableActions>
  );
}
