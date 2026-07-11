import { useEffect, useState } from 'react';
import { message, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdminButton,
  AdminText,
  AdminTextAction,
  DeleteConfirmAction,
  DetailNeighborNav,
  DetailMetaList,
  HistoryTimeline,
  RichTextViewer,
  TemplateDetailPage,
  TemplateDetailSection,
  useDetailNeighbors
} from '../../../components/admin';
import { StatusChangeModal } from '../components/StatusChangeModal';
import { deleteWorkOrder, getWorkOrder, getWorkOrderHistory, getWorkOrderNeighbors, updateWorkOrderStatus } from '../../../api/workOrderApi';
import type { WorkOrderHistoryItem, WorkOrderRecord, WorkOrderStatus } from '../types';
import {
  problemTypeText,
  renderOverdue,
  renderUrgency,
  renderWorkOrderStatus,
  statusOptions,
  statusText
} from '../helpers';
import './WorkOrderDetailPage.css';

const statusTransitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  0: [1, 3],
  1: [2, 3],
  2: [3],
  3: [0, 1, 2]
};

function buildStatusPayload(status: WorkOrderStatus, values: Record<string, unknown>) {
  return {
    status,
    resolveDate: values.actualFixedAt && typeof values.actualFixedAt === 'object' && 'format' in values.actualFixedAt
      ? (values.actualFixedAt as { format: (format: string) => string }).format('YYYY-MM-DD')
      : undefined,
    closeDate: values.closedAt && typeof values.closedAt === 'object' && 'format' in values.closedAt
      ? (values.closedAt as { format: (format: string) => string }).format('YYYY-MM-DD')
      : undefined,
    resultDesc: typeof values.result === 'string' ? values.result : undefined
  };
}

export function WorkOrderDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [statusOpen, setStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<WorkOrderStatus | undefined>();
  const [historyExpandedKeys, setHistoryExpandedKeys] = useState<string[]>([]);
  const [detail, setDetail] = useState<WorkOrderRecord>();
  const [history, setHistory] = useState<WorkOrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const neighbors = useDetailNeighbors({
    id: params.id,
    moduleKey: 'work-order',
    routeBase: '/work-orders',
    fetchNeighbors: getWorkOrderNeighbors
  });

  const loadDetail = async () => {
    if (!params.id) return;
    setLoading(true);
    setLoadError('');
    setNotFound(false);
    setDetail(undefined);
    try {
      const [record, logs] = await Promise.all([
        getWorkOrder(params.id),
        getWorkOrderHistory(params.id)
      ]);
      setDetail(record);
      setHistory(logs);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '工单加载失败';
      if (messageText.includes('不存在')) setNotFound(true);
      else setLoadError(messageText);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [params.id]);

  if (!detail) {
    return (
      <TemplateDetailPage
        title="工单详情"
        loading={loading}
        error={loadError}
        notFound={notFound}
        onRetry={loadDetail}
        onBack={() => navigate('/work-orders')}
      >
        {null}
      </TemplateDetailPage>
    );
  }

  const nextStatuses = statusOptions.filter((item) => statusTransitions[detail.status].includes(item.value));
  const expandableHistoryKeys = history.filter((item) => item.changes?.length).map((item) => item.id);
  const isAllHistoryExpanded =
    expandableHistoryKeys.length > 0 && expandableHistoryKeys.every((key) => historyExpandedKeys.includes(key));

  return (
    <TemplateDetailPage
      title="工单详情"
      onBack={() => navigate('/work-orders')}
      titleExtra={(
        <Space size={8} className="admin-template-detail-page__title-extra">
          <span className="admin-template-detail-page__code">{detail.code}</span>
          {renderWorkOrderStatus(detail.status)}
          {renderUrgency(detail.urgency)}
          {detail.status < 2 ? renderOverdue(detail.isOverdue) : null}
        </Space>
      )}
      titleCenter={(
        <DetailNeighborNav
          placement="title"
          loading={neighbors.loading}
          prevId={neighbors.prevId}
          nextId={neighbors.nextId}
          ordinal={neighbors.ordinal}
          total={neighbors.total}
          onNavigate={neighbors.navigateNeighbor}
        />
      )}
      actions={
        <>
          <AdminButton type="primary" onClick={() => navigate(`/work-orders/${detail.id}/edit`)}>编辑</AdminButton>
          <AdminButton onClick={() => navigate(`/work-orders/${detail.id}/copy`)}>复制</AdminButton>
          <DeleteConfirmAction
            entityName="工单"
            targetName={detail.problemDesc}
            onConfirm={async () => {
              await deleteWorkOrder(detail.id);
              message.success('工单已删除');
              navigate('/work-orders');
            }}
            successMessage={false}
          >
            删除
          </DeleteConfirmAction>
        </>
      }
      statusSection={{
        children: (
          <>
            <div className="work-order-detail-page__status-card">
              <div className="work-order-detail-page__status-row">
                <span>状态</span>
                {renderWorkOrderStatus(detail.status)}
              </div>
              <div className="work-order-detail-page__status-row">
                <span>紧急程度</span>
                {renderUrgency(detail.urgency)}
              </div>
              <div className="work-order-detail-page__status-row">
                <span>逾期</span>
                {detail.status < 2 ? renderOverdue(detail.isOverdue) : <AdminText type="secondary">-</AdminText>}
              </div>
            </div>
            <Space direction="vertical" size={8} className="work-order-detail-page__side-actions">
              <AdminButton block type="primary" onClick={() => {
                setTargetStatus(undefined);
                setStatusOpen(true);
              }}
              >
                状态变更
              </AdminButton>
            </Space>
          </>
        )
      }}
      documentSection={{
        items: [
          { label: '创建人', value: detail.creatorName },
          { label: '创建时间', value: detail.createdAt, wide: true },
          { label: '更新人', value: detail.updaterName || '-' },
          { label: '更新时间', value: detail.updatedAt || '-', wide: true }
        ]
      }}
    >
          <TemplateDetailSection title="基本信息">
            <div className="work-order-detail-page__issue-summary">
              <div className="work-order-detail-page__issue-content">
                <span className="work-order-detail-page__issue-label">问题描述</span>
                <div className="work-order-detail-page__issue-title">
                  <RichTextViewer value={detail.problemDesc} />
                </div>
              </div>
            </div>
            <DetailMetaList
              items={[
                { label: '所属系统', value: detail.systemName },
                { label: '问题类型', value: problemTypeText(detail.problemType, detail.problemTypeName) }
              ]}
            />
          </TemplateDetailSection>

          <TemplateDetailSection title="处理信息">
            <DetailMetaList
              items={[
                { label: '提出人', value: detail.submitterName },
                { label: '提出组织', value: detail.submitterDept },
                { label: '提出时间', value: detail.submitTime },
                { label: '跟进人', value: detail.followerName || '-' },
                { label: '预计完成时间', value: detail.expectedResolveDate },
                { label: '实际修复时间', value: detail.resolveDate || '-' },
                { label: '关闭时间', value: detail.closeDate || '-' },
                { label: '处置结果', value: detail.resultDesc || '-', wide: true }
              ]}
            />
          </TemplateDetailSection>

          <TemplateDetailSection
            title="变更历史"
            inlineExtra={expandableHistoryKeys.length > 0 ? (
                <AdminTextAction
                  onClick={() => setHistoryExpandedKeys(isAllHistoryExpanded ? [] : expandableHistoryKeys)}
                >
                  {isAllHistoryExpanded ? '全部收起' : '全部展开'}
                </AdminTextAction>
            ) : null}
          >
            <HistoryTimeline
              items={history}
              expandedKeys={historyExpandedKeys}
              onExpandedKeysChange={setHistoryExpandedKeys}
            />
          </TemplateDetailSection>

      <StatusChangeModal
        open={statusOpen}
        workOrder={detail}
        targetStatus={targetStatus}
        statusOptions={nextStatuses}
        onTargetStatusChange={setTargetStatus}
        onCancel={() => {
          setStatusOpen(false);
          setTargetStatus(undefined);
        }}
        onConfirm={async (values) => {
          if (targetStatus === undefined) return;
          await updateWorkOrderStatus(detail.id, buildStatusPayload(targetStatus, values));
          await loadDetail();
          message.success(`状态已更新为 ${statusText(targetStatus)}`);
          setStatusOpen(false);
          setTargetStatus(undefined);
        }}
      />
    </TemplateDetailPage>
  );
}
