import { Form } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import {
  AdminDatePicker,
  AdminTextArea,
  StatusChangeAction,
  type StatusChangeActionProps,
  type StatusChangeOption,
  type StatusFlowModalFormValues
} from '../../../../components/admin';
import type { WorkOrderRecord, WorkOrderStatus } from '../../types';
import { renderWorkOrderStatus } from '../../helpers';

type StatusOption = {
  label: string;
  value: WorkOrderStatus;
};

type WorkOrderStatusChangeActionProps = Omit<
  StatusChangeActionProps<WorkOrderStatus>,
  'current' | 'currentValue' | 'formValues' | 'options' | 'renderExtra'
> & {
  workOrder: WorkOrderRecord;
  statusOptions: StatusOption[];
  preserveCompletedValues?: boolean;
  onConfirm: (target: WorkOrderStatus, values: StatusFlowModalFormValues) => Promise<void> | void;
};

const toneByStatus: Record<WorkOrderStatus, StatusChangeOption<WorkOrderStatus>['tone']> = {
  0: 'normal',
  1: 'normal',
  2: 'success',
  3: 'danger'
};

export function WorkOrderStatusChangeAction({
  workOrder,
  statusOptions,
  preserveCompletedValues = true,
  ...props
}: WorkOrderStatusChangeActionProps) {
  const formValues = useMemo(() => {
    if (!preserveCompletedValues || workOrder.status !== 3) return undefined;
    return {
      actualFixedAt: workOrder.resolveDate ? dayjs(workOrder.resolveDate) : undefined,
      result: workOrder.resultDesc || undefined
    };
  }, [preserveCompletedValues, workOrder]);

  return (
    <StatusChangeAction<WorkOrderStatus>
      {...props}
      current={workOrder.status}
      currentValue={renderWorkOrderStatus(workOrder.status)}
      formValues={formValues}
      options={statusOptions.map((item) => ({ ...item, tone: toneByStatus[item.value] }))}
      renderExtra={(target) => (
        <>
          {target === 2 ? (
            <Form.Item
              name="actualFixedAt"
              label="实际修复时间"
              rules={[{ required: true, message: '请选择实际修复时间' }]}
            >
              <AdminDatePicker placeholder="请选择实际修复时间" />
            </Form.Item>
          ) : null}
          {target === 3 ? (
            <Form.Item
              name="closedAt"
              label="关闭时间"
              rules={[{ required: true, message: '请选择关闭时间' }]}
            >
              <AdminDatePicker placeholder="请选择关闭时间" />
            </Form.Item>
          ) : null}
          {target === 2 ? (
            <Form.Item
              name="result"
              label="处置结果"
              rules={[{ required: true, whitespace: true, message: '请输入处置结果' }]}
            >
              <AdminTextArea rows={3} placeholder="请输入处置结果" />
            </Form.Item>
          ) : null}
        </>
      )}
    />
  );
}
