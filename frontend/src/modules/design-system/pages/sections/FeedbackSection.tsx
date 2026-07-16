import { type Key, useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import {
  AdminActionDropdown,
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminDatePicker,
  AdminDrawer,
  AdminFormItem,
  AdminInput,
  AdminModal,
  AdminParagraph,
  AdminProgress,
  AdminRangePicker,
  AdminSelect,
  AdminSpace,
  AdminSpin,
  AdminTextAction,
  AdminTextArea,
  BubbleConfirmAction,
  CompactFilterBar,
  createListFilterItems,
  createListSorters,
  DeleteConfirmAction,
  listSorters,
  OperationColumnActions,
  StatusConfirmAction,
  StatusFlowModal,
  TemplateDrawerTable,
  useAdminFeedback,
  useTemplateListPageData
} from '../../../../components/admin';
import { mockWorkOrders, workOrderUsers } from '../../../work-order/mock';
import type { WorkOrderRecord, WorkOrderStatus } from '../../../work-order/types';
import {
  problemTypeOptions,
  problemTypeText,
  renderOverdue,
  renderUrgency,
  renderWorkOrderStatus,
  statusOptions,
  urgencyOptions
} from '../../../work-order/helpers';
import { ComponentEntry } from '../components/ComponentEntry';
import './FeedbackSection.css';

type DrawerTableRecord = WorkOrderRecord;

type DrawerTableFilters = {
  problemDesc: string;
  problemTypes: WorkOrderRecord['problemType'][];
  urgency?: WorkOrderRecord['urgency'];
  status?: WorkOrderRecord['status'];
  isOverdue?: boolean;
  followerId?: string;
  submitterName: string;
  submitTimeRange: unknown[];
  expectedResolveDateRange: unknown[];
};

const defaultDrawerTableFilters: DrawerTableFilters = {
  problemDesc: '',
  problemTypes: [],
  urgency: undefined,
  status: undefined,
  isOverdue: undefined,
  followerId: undefined,
  submitterName: '',
  submitTimeRange: [],
  expectedResolveDateRange: []
};

const listTemplateSorters = createListSorters<WorkOrderRecord>({
  problemDesc: listSorters.text((row) => row.problemDesc),
  problemType: listSorters.text((row) => problemTypeText(row.problemType)),
  followerName: listSorters.text((row) => row.followerName),
  urgency: listSorters.number((row) => row.urgency),
  status: listSorters.number((row) => row.status),
  submitterName: listSorters.text((row) => row.submitterName),
  submitTime: listSorters.date((row) => row.submitTime),
  expectedResolveDate: listSorters.date((row) => row.expectedResolveDate)
});

function toDateText(value: unknown) {
  if (!value) return '';
  if (typeof value === 'object' && 'format' in value && typeof value.format === 'function') {
    return value.format('YYYY-MM-DD');
  }
  return String(value).slice(0, 10);
}

function inDateRange(value: string, range: unknown[]) {
  if (range.length !== 2 || !range[0] || !range[1]) return true;
  const start = toDateText(range[0]);
  const end = toDateText(range[1]);
  const current = value.slice(0, 10);
  return current >= start && current <= end;
}

const drawerTableColumns: ProColumns<DrawerTableRecord>[] = [
  { title: '序号', valueType: 'index', width: 48, fixed: 'left', hideInSetting: true },
  {
    title: '问题描述',
    dataIndex: 'problemDesc',
    width: 320,
    fixed: 'left',
    ellipsis: true,
    sorter: (a, b) => a.problemDesc.localeCompare(b.problemDesc),
    render: (_, record) => (
      <div className="design-system-page__drawer-problem-cell">
        <AdminTextAction className="design-system-page__drawer-table-link" title={record.problemDesc}>
          {record.problemDesc}
        </AdminTextAction>
        {record.isOverdue ? <span className="design-system-page__drawer-problem-tag">{renderOverdue(true)}</span> : null}
      </div>
    )
  },
  {
    title: '问题类型',
    dataIndex: 'problemType',
    width: 100,
    ellipsis: true,
    sorter: (a, b) => problemTypeText(a.problemType).localeCompare(problemTypeText(b.problemType)),
    render: (_, record) => problemTypeText(record.problemType)
  },
  {
    title: '跟进人',
    dataIndex: 'followerName',
    width: 80,
    ellipsis: true,
    sorter: (a, b) => (a.followerName || '').localeCompare(b.followerName || '')
  },
  {
    title: '紧急程度',
    dataIndex: 'urgency',
    width: 80,
    sorter: (a, b) => a.urgency - b.urgency,
    render: (_, record) => renderUrgency(record.urgency)
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
    sorter: (a, b) => a.status - b.status,
    render: (_, record) => renderWorkOrderStatus(record.status)
  },
  {
    title: '提出人',
    dataIndex: 'submitterName',
    width: 80,
    ellipsis: true,
    sorter: (a, b) => a.submitterName.localeCompare(b.submitterName)
  },
  {
    title: '提出时间',
    dataIndex: 'submitTime',
    width: 130,
    sorter: (a, b) => a.submitTime.localeCompare(b.submitTime),
    render: (_, record) => record.submitTime.slice(0, 10)
  },
  { title: '预计完成时间', dataIndex: 'expectedResolveDate', width: 140 },
  { title: '创建人', dataIndex: 'creatorName', width: 80, ellipsis: true },
  { title: '创建时间', dataIndex: 'createdAt', width: 150, ellipsis: true },
  {
    title: '操作',
    valueType: 'option',
    width: 180,
    fixed: 'right',
    render: () => (
      <OperationColumnActions>
        <AdminTextAction className="design-system-page__drawer-table-link">编辑</AdminTextAction>
        <AdminTextAction className="design-system-page__drawer-table-link">状态变更</AdminTextAction>
        <AdminActionDropdown
          items={[
            { key: 'copy', label: '复制' },
            { key: 'delete', label: '删除', danger: true }
          ]}
          onClick={() => undefined}
        />
      </OperationColumnActions>
    )
  }
];

const feedbackSpecs = [
  { label: '轻提示与横幅', value: '用于即时反馈和页面内持续提示，短句中文，靠近相关内容' },
  { label: '通知提醒', value: '用于后台任务或跨区域提醒，标题说事件，正文说下一步' },
  { label: '气泡确认框', value: '用于按钮或文字操作旁的二次确认，高风险动作必须说明后果' },
  { label: '进度反馈', value: '用于导入、导出、批处理等可量化任务，明确展示完成比例' },
  { label: '加载状态', value: '用于局部等待和提交中状态，只加载正在处理的区域' },
  { label: '弹窗与抽屉', value: '弹窗承接短流程，抽屉承接侧向补充，不替代详情页' }
];

export function FeedbackSection() {
  const { message, notification } = useAdminFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [tableDrawerOpen, setTableDrawerOpen] = useState(false);
  const [statusFlowOpen, setStatusFlowOpen] = useState(false);
  const [statusFlowTarget, setStatusFlowTarget] = useState<WorkOrderStatus | undefined>();
  const [tableDrawerFilterExpanded, setTableDrawerFilterExpanded] = useState(false);
  const [tableDrawerDraftFilters, setTableDrawerDraftFilters] = useState<DrawerTableFilters>(defaultDrawerTableFilters);
  const [tableDrawerAppliedFilters, setTableDrawerAppliedFilters] = useState<DrawerTableFilters>(defaultDrawerTableFilters);
  const [tableDrawerSelectedRowKeys, setTableDrawerSelectedRowKeys] = useState<Key[]>([]);
  const [tableDrawerSelectedRows, setTableDrawerSelectedRows] = useState<DrawerTableRecord[]>([]);

  const tableDrawerFilteredRows = useMemo(() => mockWorkOrders.filter((row) => {
    const matchProblem = tableDrawerAppliedFilters.problemDesc
      ? row.problemDesc.includes(tableDrawerAppliedFilters.problemDesc)
      : true;
    const matchSubmitter = tableDrawerAppliedFilters.submitterName
      ? row.submitterName.includes(tableDrawerAppliedFilters.submitterName)
      : true;
    const matchProblemType = tableDrawerAppliedFilters.problemTypes.length > 0
      ? tableDrawerAppliedFilters.problemTypes.includes(row.problemType)
      : true;
    const matchUrgency = tableDrawerAppliedFilters.urgency !== undefined
      ? row.urgency === tableDrawerAppliedFilters.urgency
      : true;
    const matchStatus = tableDrawerAppliedFilters.status !== undefined
      ? row.status === tableDrawerAppliedFilters.status
      : true;
    const matchOverdue = tableDrawerAppliedFilters.isOverdue !== undefined
      ? row.isOverdue === tableDrawerAppliedFilters.isOverdue
      : true;
    const matchFollower = tableDrawerAppliedFilters.followerId
      ? row.followerId === tableDrawerAppliedFilters.followerId
      : true;
    const matchSubmitTime = inDateRange(row.submitTime, tableDrawerAppliedFilters.submitTimeRange);
    const matchExpectedTime = inDateRange(row.expectedResolveDate, tableDrawerAppliedFilters.expectedResolveDateRange);

    return matchProblem
      && matchSubmitter
      && matchProblemType
      && matchUrgency
      && matchStatus
      && matchOverdue
      && matchFollower
      && matchSubmitTime
      && matchExpectedTime;
  }), [tableDrawerAppliedFilters]);

  const {
    pagedRows: tableDrawerRows,
    pagination: tableDrawerPagination,
    handleTableChange: handleTableDrawerTableChange,
    renderIndex: renderTableDrawerIndex,
    setCurrentPage: setTableDrawerCurrentPage
  } = useTemplateListPageData({
    rows: tableDrawerFilteredRows,
    sorters: listTemplateSorters,
    resetOn: [tableDrawerAppliedFilters]
  });

  const tableDrawerDisplayColumns = drawerTableColumns.map((column, index) => index === 0
    ? {
      ...column,
      valueType: undefined,
      render: (_: unknown, __: DrawerTableRecord, rowIndex: number) => renderTableDrawerIndex(rowIndex)
    }
    : column);


  const tableDrawerFilterItems = useMemo(() => createListFilterItems([
    {
      key: 'problemDesc',
      label: '问题描述',
      node: (
        <AdminInput
          size="small"
          value={tableDrawerDraftFilters.problemDesc}
          placeholder="请输入"
          onChange={(event) => setTableDrawerDraftFilters((prev) => ({ ...prev, problemDesc: event.target.value }))}
          onPressEnter={() => {
            setTableDrawerAppliedFilters(tableDrawerDraftFilters);
            setTableDrawerCurrentPage(1);
            setTableDrawerSelectedRowKeys([]);
            setTableDrawerSelectedRows([]);
          }}
        />
      )
    },
    {
      key: 'problemType',
      label: '问题类型',
      node: (
        <AdminSelect
          size="small"
          mode="multiple"
          maxTagCount="responsive"
          allowClear
          optionFilterProp="label"
          value={tableDrawerDraftFilters.problemTypes}
          options={problemTypeOptions}
          placeholder="全部"
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, problemTypes: value }))}
        />
      )
    },
    {
      key: 'urgency',
      label: '紧急程度',
      node: (
        <AdminSelect
          size="small"
          allowClear
          optionFilterProp="label"
          value={tableDrawerDraftFilters.urgency}
          options={urgencyOptions}
          placeholder="全部"
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, urgency: value }))}
        />
      )
    },
    {
      key: 'status',
      label: '状态',
      node: (
        <AdminSelect
          size="small"
          allowClear
          optionFilterProp="label"
          value={tableDrawerDraftFilters.status}
          options={statusOptions}
          placeholder="全部"
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, status: value }))}
        />
      )
    },
    {
      key: 'isOverdue',
      label: '逾期',
      node: (
        <AdminSelect
          size="small"
          allowClear
          optionFilterProp="label"
          value={tableDrawerDraftFilters.isOverdue}
          options={[
            { label: '未逾期', value: false },
            { label: '逾期', value: true }
          ]}
          placeholder="全部"
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, isOverdue: value }))}
        />
      )
    },
    {
      key: 'followerId',
      label: '跟进人',
      node: (
        <AdminSelect
          size="small"
          allowClear
          optionFilterProp="label"
          value={tableDrawerDraftFilters.followerId}
          options={workOrderUsers}
          placeholder="全部"
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, followerId: value }))}
        />
      )
    },
    {
      key: 'submitterName',
      label: '提出人',
      node: (
        <AdminInput
          size="small"
          value={tableDrawerDraftFilters.submitterName}
          placeholder="请输入"
          onChange={(event) => setTableDrawerDraftFilters((prev) => ({ ...prev, submitterName: event.target.value }))}
          onPressEnter={() => {
            setTableDrawerAppliedFilters(tableDrawerDraftFilters);
            setTableDrawerCurrentPage(1);
            setTableDrawerSelectedRowKeys([]);
            setTableDrawerSelectedRows([]);
          }}
        />
      )
    },
    {
      key: 'submitTimeRange',
      label: '提出时间',
      wide: true,
      node: (
        <AdminRangePicker
          size="small"
          value={tableDrawerDraftFilters.submitTimeRange as never}
          placeholder={['开始日期', '结束日期']}
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, submitTimeRange: value || [] }))}
        />
      )
    },
    {
      key: 'expectedResolveDateRange',
      label: '预计完成时间',
      wide: true,
      node: (
        <AdminRangePicker
          size="small"
          value={tableDrawerDraftFilters.expectedResolveDateRange as never}
          placeholder={['开始日期', '结束日期']}
          onChange={(value) => setTableDrawerDraftFilters((prev) => ({ ...prev, expectedResolveDateRange: value || [] }))}
        />
      )
    }
  ]), [tableDrawerDraftFilters]);

  return (
    <>
            <div className="design-system-page__section design-system-page__feedback">
            <AdminCard title="反馈组件">
              <div className="design-system-page__base-rule-grid">
                {feedbackSpecs.map((item) => (
                  <section className="design-system-page__base-rule-card" key={item.label}>
                    <h3>{item.label}</h3>
                    <p>{item.value}</p>
                  </section>
                ))}
              </div>
            </AdminCard>

            <AdminCard title="1. 轻提示与横幅">
              <div className="design-system-page__input-grid">
                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>轻提示</h3>
                    <ComponentEntry name="useAdminFeedback().message" />
                    <p>用于保存、删除、复制等即时反馈。短句中文、自动消失，不承载复杂说明。</p>
                  </div>
                  <div className="design-system-page__input-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>普通提示</h4>
                      <AdminButton onClick={() => message.info('数据已刷新')}>显示提示</AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>成功提示</h4>
                      <AdminButton
                        className="design-system-page__feedback-button--success"
                        onClick={() => message.success('保存成功')}
                      >
                        显示成功
                      </AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>警告提示</h4>
                      <AdminButton
                        className="design-system-page__feedback-button--warning"
                        onClick={() => message.warning('请先选择处理人')}
                      >
                        显示警告
                      </AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>失败提示</h4>
                      <AdminButton danger onClick={() => message.error('保存失败，请检查必填字段')}>显示失败</AdminButton>
                    </div>
                  </div>
                </section>

                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>通知横幅</h3>
                    <ComponentEntry name="AdminAlert" />
                    <p>用于页面内持续可见的状态提示。靠近相关区域，不替代弹窗确认。</p>
                  </div>
                  <div className="design-system-page__input-stack">
                    <AdminAlert type="info" message="已同步最新数据" showIcon />
                    <AdminAlert type="success" message="保存成功，变更已同步" showIcon />
                    <AdminAlert type="warning" message="当前筛选条件较多，查询可能耗时较长" showIcon />
                    <AdminAlert type="error" message="保存失败，请检查必填字段" showIcon />
                  </div>
                </section>
              </div>
            </AdminCard>

            <AdminCard title="2. 通知提醒">
              <div className="design-system-page__input-grid">
                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>通知提醒</h3>
                    <ComponentEntry name="useAdminFeedback().notification" />
                    <p>用于跨区域提醒或后台任务结果。标题说明事件，正文说明原因和下一步。</p>
                  </div>
                  <div className="design-system-page__input-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>任务完成</h4>
                      <AdminButton
                        className="design-system-page__feedback-button--success"
                        onClick={() => notification.success({ message: '导出完成', description: '工单明细已生成，可以在下载中心查看。' })}
                      >
                        显示通知
                      </AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>风险提醒</h4>
                      <AdminButton
                        className="design-system-page__feedback-button--warning"
                        onClick={() => notification.warning({ message: '存在逾期工单', description: '当前筛选结果中有 3 条工单已逾期，请优先处理。' })}
                      >
                        显示提醒
                      </AdminButton>
                    </div>
                  </div>
                </section>
              </div>
            </AdminCard>

            <AdminCard title="3. 气泡确认框">
              <div className="design-system-page__input-grid">
                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>普通确认</h3>
                    <ComponentEntry name="BubbleConfirmAction" />
                    <p>用于轻量二次确认，跟随触发按钮出现，不打断整个页面。</p>
                  </div>
                  <div className="design-system-page__input-demo-list design-system-page__confirm-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>继续操作</h4>
                      <BubbleConfirmAction
                        title="确认继续提交？"
                        successMessage={false}
                        onConfirm={() => {
                          message.success('提交确认已触发');
                        }}
                      >
                        提交确认
                      </BubbleConfirmAction>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>轻量撤销</h4>
                      <BubbleConfirmAction
                        title="确认撤销当前操作？"
                        successMessage={false}
                        onConfirm={() => {
                          message.success('撤销确认已触发');
                        }}
                      >
                        撤销确认
                      </BubbleConfirmAction>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>删除气泡</h4>
                      <BubbleConfirmAction
                        danger
                        title="确认删除该记录？"
                        description="删除后无法恢复，适合低复杂度的单条记录删除。"
                        successMessage={false}
                        onConfirm={() => {
                          message.success('删除气泡确认已触发');
                        }}
                      >
                        删除气泡确认
                      </BubbleConfirmAction>
                    </div>
                  </div>
                </section>

                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>弹窗确认</h3>
                    <ComponentEntry name="StatusConfirmAction / DeleteConfirmAction" />
                    <p>用于启用、停用、删除等需要明确确认的操作。</p>
                  </div>
                  <div className="design-system-page__input-demo-list design-system-page__confirm-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>启用记录</h4>
                      <StatusConfirmAction
                        action="enable"
                        entityName="记录"
                        targetName="客户资料"
                        type="primary"
                        successMessage={false}
                        onConfirm={() => {
                          message.success('启用确认已提交');
                        }}
                      >
                        启用确认
                      </StatusConfirmAction>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>停用记录</h4>
                      <StatusConfirmAction
                        action="disable"
                        entityName="记录"
                        targetName="客户资料"
                        successMessage={false}
                        onConfirm={() => {
                          message.success('停用确认已提交');
                        }}
                      >
                        停用确认
                      </StatusConfirmAction>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>删除记录</h4>
                      <DeleteConfirmAction
                        entityName="记录"
                        targetName="客户资料"
                        successMessage={false}
                        onConfirm={() => {
                          message.success('删除确认已提交');
                        }}
                      >
                        删除弹窗确认
                      </DeleteConfirmAction>
                    </div>
                  </div>
                </section>
              </div>
            </AdminCard>

            <AdminCard title="4. 进度反馈">
              <div className="design-system-page__input-grid">
                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>进度反馈</h3>
                    <ComponentEntry name="AdminProgress" />
                    <p>用于导入、导出、批量处理等可量化任务。能给进度就不要只给加载中。</p>
                  </div>
                  <div className="design-system-page__input-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>线性进度</h4>
                      <AdminProgress percent={68} />
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>小型进度</h4>
                      <AdminProgress percent={42} size="small" status="active" />
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>步骤进度</h4>
                      <AdminProgress percent={100} steps={5} size="small" />
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>异常进度</h4>
                      <AdminProgress percent={36} status="exception" />
                    </div>
                  </div>
                </section>
              </div>
            </AdminCard>

            <AdminCard title="5. 加载状态">
              <div className="design-system-page__input-grid">
                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>加载状态</h3>
                    <ComponentEntry name="AdminSpin / AdminButton / AdminCard" />
                    <p>用于局部等待和按钮提交。局部操作只加载局部，不让整页失去控制。</p>
                  </div>
                  <div className="design-system-page__input-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>局部加载</h4>
                      <AdminSpin tip="加载中">
                        <div className="design-system-page__spin-box" />
                      </AdminSpin>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>按钮加载</h4>
                      <AdminButton type="primary" loading>提交中</AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>文字按钮加载</h4>
                      <AdminTextAction loading>刷新中</AdminTextAction>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>卡片加载</h4>
                      <AdminCard size="small" loading title="工单统计" />
                    </div>
                  </div>
                </section>
              </div>
            </AdminCard>

            <AdminCard title="6. 弹窗与抽屉">
              <div className="design-system-page__input-grid">
                <section className="design-system-page__input-panel">
                  <div className="design-system-page__input-panel-head">
                    <h3>弹窗与抽屉</h3>
                    <ComponentEntry name="AdminModal / AdminDrawer / TemplateDrawerTable / StatusFlowModal" />
                    <p>弹窗用于短流程，抽屉用于侧向补充。通用按钮统一使用取消和确认。</p>
                  </div>
                  <div className="design-system-page__input-demo-list">
                    <div className="design-system-page__input-demo">
                      <h4>普通弹窗</h4>
                      <AdminButton onClick={() => setModalOpen(true)}>打开弹窗</AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>状态流转弹窗</h4>
                      <AdminButton
                        onClick={() => {
                          setStatusFlowTarget(undefined);
                          setStatusFlowOpen(true);
                        }}
                      >
                        打开状态流转
                      </AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>侧向抽屉</h4>
                      <AdminButton onClick={() => setDrawerOpen(true)}>打开抽屉</AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>表单抽屉</h4>
                      <AdminButton onClick={() => setFormDrawerOpen(true)}>打开表单抽屉</AdminButton>
                    </div>
                    <div className="design-system-page__input-demo">
                      <h4>表格抽屉</h4>
                      <AdminButton onClick={() => setTableDrawerOpen(true)}>打开表格抽屉</AdminButton>
                    </div>
                  </div>
                </section>
              </div>
            </AdminCard>
            </div>

      <StatusFlowModal<WorkOrderStatus>
        open={statusFlowOpen}
        currentValue={renderWorkOrderStatus(0)}
        targetValue={statusFlowTarget}
        targetText={statusFlowTarget !== undefined ? renderWorkOrderStatus(statusFlowTarget) : undefined}
        targetOptions={statusOptions.filter((item) => item.value !== 0)}
        onTargetChange={setStatusFlowTarget}
        onCancel={() => {
          setStatusFlowOpen(false);
          setStatusFlowTarget(undefined);
        }}
        onConfirm={() => {
          message.success('状态已变更');
          setStatusFlowOpen(false);
          setStatusFlowTarget(undefined);
        }}
        renderExtra={(target) => (
          target === 2 ? (
            <>
              <AdminFormItem
                name="resolveDate"
                label="实际修复时间"
                rules={[{ required: true, message: '请选择实际修复时间' }]}
              >
                <AdminDatePicker
                  placeholder="请选择实际修复时间"
                />
              </AdminFormItem>
              <AdminFormItem
                name="resultDesc"
                label="处理结果"
                rules={[{ required: true, message: '请输入处理结果' }]}
              >
                <AdminTextArea rows={5} maxLength={100} showCount placeholder="请输入处理结果" />
              </AdminFormItem>
            </>
          ) : null
        )}
      />

      <AdminModal
        title="演示弹窗"
        open={modalOpen}
        width={560}
        onCancel={() => setModalOpen(false)}
        onOk={() => setModalOpen(false)}
      >
        <AdminParagraph>
          弹窗用于短流程确认和少量字段录入，内容要聚焦，不承载复杂列表。
        </AdminParagraph>
        <div className="design-system-page__modal-form">
          <label>
            <span>工单标题</span>
            <AdminInput placeholder="请输入工单标题" />
          </label>
          <label>
            <span>问题类型</span>
            <AdminSelect
              placeholder="请选择问题类型"
              options={[
                { label: '日常操作', value: 'daily' },
                { label: '系统优化', value: 'optimize' },
                { label: '故障报障', value: 'fault' }
              ]}
            />
          </label>
          <label>
            <span>紧急程度</span>
            <AdminSelect
              placeholder="请选择紧急程度"
              options={[
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' }
              ]}
            />
          </label>
          <label>
            <span>跟进人</span>
            <AdminSelect
              placeholder="请选择跟进人"
              options={[
                { label: 'A001·管理员', value: 'admin' },
                { label: 'A002·运维人员', value: 'ops' },
                { label: 'A003·审核人员', value: 'reviewer' }
              ]}
            />
          </label>
          <label className="design-system-page__modal-form-full">
            <span>备注说明</span>
            <AdminTextArea rows={3} placeholder="请输入备注说明" />
          </label>
        </div>
      </AdminModal>

      <AdminDrawer
        title="演示抽屉"
        width={420}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="design-system-page__drawer-footer">
            <AdminButton onClick={() => setDrawerOpen(false)}>取消</AdminButton>
            <AdminButton type="primary" onClick={() => setDrawerOpen(false)}>确认</AdminButton>
          </div>
        }
      >
        <AdminParagraph>
          抽屉用于中等复杂度的表单和上下文操作。
        </AdminParagraph>
        <AdminTextArea rows={4} placeholder="抽屉输入区" />
      </AdminDrawer>

      <AdminDrawer
        title="表单抽屉"
        width={720}
        open={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        footer={
          <div className="design-system-page__drawer-footer">
            <AdminButton onClick={() => setFormDrawerOpen(false)}>取消</AdminButton>
            <AdminButton type="primary" onClick={() => setFormDrawerOpen(false)}>确认</AdminButton>
          </div>
        }
      >
        <AdminParagraph>
          表单抽屉用于承载较完整的上下文数据，适合不离开当前列表的新增、编辑和补充信息。
        </AdminParagraph>
        <div className="design-system-page__drawer-form">
          <label>
            <span>工单标题</span>
            <AdminInput placeholder="请输入工单标题" />
          </label>
          <label>
            <span>问题类型</span>
            <AdminSelect
              placeholder="请选择问题类型"
              options={[
                { label: '日常操作', value: 'daily' },
                { label: '系统优化', value: 'optimize' },
                { label: '故障报障', value: 'fault' }
              ]}
            />
          </label>
          <label>
            <span>紧急程度</span>
            <AdminSelect
              placeholder="请选择紧急程度"
              options={[
                { label: '高', value: 'high' },
                { label: '中', value: 'medium' },
                { label: '低', value: 'low' }
              ]}
            />
          </label>
          <label>
            <span>跟进人</span>
            <AdminSelect
              placeholder="请选择跟进人"
              options={[
                { label: 'A001·管理员', value: 'admin' },
                { label: 'A002·运维人员', value: 'ops' },
                { label: 'A003·审核人员', value: 'reviewer' }
              ]}
            />
          </label>
          <label className="design-system-page__drawer-form-full">
            <span>问题描述</span>
            <AdminTextArea rows={5} placeholder="请输入问题描述" />
          </label>
          <label className="design-system-page__drawer-form-full">
            <span>处理备注</span>
            <AdminTextArea rows={4} placeholder="请输入处理备注" />
          </label>
        </div>
      </AdminDrawer>

      <TemplateDrawerTable<DrawerTableRecord>
        title="表格抽屉"
        width="calc(100vw - 180px)"
        open={tableDrawerOpen}
        onClose={() => setTableDrawerOpen(false)}
        description="表格抽屉用于在不离开当前页面的情况下查看关联数据，必须包含查询、表格、页码和操作。"
        list={{
          mode: 'batch',
          filter: (
            <CompactFilterBar
              items={tableDrawerFilterItems}
              expanded={tableDrawerFilterExpanded}
              visibleCount={4}
              onExpandChange={setTableDrawerFilterExpanded}
              onSearch={() => {
                setTableDrawerAppliedFilters(tableDrawerDraftFilters);
                setTableDrawerCurrentPage(1);
                setTableDrawerSelectedRowKeys([]);
                setTableDrawerSelectedRows([]);
              }}
              onReset={() => {
                setTableDrawerDraftFilters(defaultDrawerTableFilters);
                setTableDrawerAppliedFilters(defaultDrawerTableFilters);
                setTableDrawerCurrentPage(1);
                setTableDrawerSelectedRowKeys([]);
                setTableDrawerSelectedRows([]);
              }}
            />
          ),
          table: {
            columns: tableDrawerDisplayColumns,
            dataSource: tableDrawerRows,
            preferenceKey: 'design-system:drawer-table',
            pagination: false,
            rowSelection: {
              selectedRowKeys: tableDrawerSelectedRowKeys,
              onChange: (keys, rows) => {
                setTableDrawerSelectedRowKeys(keys);
                setTableDrawerSelectedRows(rows);
              }
            },
            search: false,
            scroll: { x: 1600 },
            tableAlertRender: false,
            onChange: handleTableDrawerTableChange
          },
          batch: {
            selectedCount: tableDrawerSelectedRowKeys.length,
            actions: (
              <AdminSpace size={8}>
                <AdminButton size="small">批量指派</AdminButton>
                <AdminButton size="small" disabled={tableDrawerSelectedRows.length === 0}>批量状态变更</AdminButton>
                <DeleteConfirmAction
                  size="small"
                  disabled={tableDrawerSelectedRows.length === 0}
                  entityName="选中的"
                  targetName={`${tableDrawerSelectedRows.length} 项工单`}
                  title="确认批量删除工单"
                  successMessage={`已删除 ${tableDrawerSelectedRows.length} 项工单`}
                  onConfirm={() => {
                    setTableDrawerSelectedRowKeys([]);
                    setTableDrawerSelectedRows([]);
                  }}
                >
                  批量删除
                </DeleteConfirmAction>
              </AdminSpace>
            )
          },
          pagination: {
            ...tableDrawerPagination,
            onChange: (page, pageSize) => {
              tableDrawerPagination.onChange(page, pageSize);
              setTableDrawerSelectedRowKeys([]);
              setTableDrawerSelectedRows([]);
            },
            onShowSizeChange: (page, pageSize) => {
              tableDrawerPagination.onShowSizeChange(page, pageSize);
              setTableDrawerSelectedRowKeys([]);
              setTableDrawerSelectedRows([]);
            }
          }
        }}
      />
    </>
  );
}
