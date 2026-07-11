import { useMemo, useState } from 'react';
import type { ProColumns } from '@ant-design/pro-components';
import {
  AdminButton,
  AdminDrawer,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminSpace,
  AdminTextArea,
  CompactFilterBar,
  createListSorters,
  DeleteConfirmAction,
  listSorters,
  StatusFlowModal,
  TemplateDrawerTable,
  useAdminFeedback,
  useTemplateListPageData
} from '../../../../components/admin';
import { ComponentEntry } from '../components/ComponentEntry';
import './OverlayTemplateDemo.css';

type OverlayTableRecord = Record<string, unknown> & {
  id: string;
  name: string;
  type: string;
  owner: string;
};

const overlayTableRows: OverlayTableRecord[] = [
  { id: '1', name: '生产环境登录异常', type: '故障报障', owner: '管理员' },
  { id: '2', name: '知识库同步任务失败', type: '系统优化', owner: '运维人员' },
  { id: '3', name: '角色权限调整', type: '后台维护', owner: '审核人员' },
  { id: '4', name: '基础档案重复编码', type: '其他', owner: '管理员' }
];

const overlayTableColumns: ProColumns<OverlayTableRecord>[] = [
  { title: '序号', valueType: 'index', width: 60, hideInSetting: true },
  { title: '问题描述', dataIndex: 'name', width: 260, ellipsis: true, sorter: true },
  { title: '问题类型', dataIndex: 'type', width: 120, sorter: true },
  { title: '跟进人', dataIndex: 'owner', width: 110, sorter: true }
];

const overlayTableSorters = createListSorters<OverlayTableRecord>({
  name: listSorters.text((row) => row.name),
  type: listSorters.text((row) => row.type),
  owner: listSorters.text((row) => row.owner)
});

export function OverlayTemplateDemo() {
  const { message } = useAdminFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>();
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [tableDrawerOpen, setTableDrawerOpen] = useState(false);
  const [draftKeyword, setDraftKeyword] = useState('');
  const [keyword, setKeyword] = useState('');

  const filteredRows = useMemo(
    () => overlayTableRows.filter((row) => row.name.includes(keyword)),
    [keyword]
  );
  const {
    pagedRows,
    pagination,
    handleTableChange,
    renderIndex
  } = useTemplateListPageData({
    rows: filteredRows,
    sorters: overlayTableSorters,
    resetOn: [keyword]
  });
  const columns = overlayTableColumns.map((column, index) => index === 0
    ? { ...column, valueType: undefined, render: (_: unknown, __: OverlayTableRecord, rowIndex: number) => renderIndex(rowIndex) }
    : column);

  return (
    <div className="design-system-page__layout-pattern-template overlay-template-demo">
      <div className="design-system-page__input-panel-head">
        <h3>弹窗 / 抽屉模板</h3>
        <ComponentEntry name="AdminModal / StatusFlowModal / DeleteConfirmAction / AdminDrawer / TemplateDrawerTable" />
        <p>页面模式展示完整业务组合：弹窗负责短流程和确认，抽屉负责侧向表单与关联列表。</p>
      </div>

      <div className="overlay-template-demo__grid">
        <section>
          <h4>普通业务弹窗</h4>
          <p>用于需要补充少量信息的短流程。</p>
          <AdminButton onClick={() => setModalOpen(true)}>打开普通弹窗</AdminButton>
        </section>
        <section>
          <h4>状态变更弹窗</h4>
          <p>列表与详情共用同一状态流转结构。</p>
          <AdminButton onClick={() => setStatusOpen(true)}>打开状态变更</AdminButton>
        </section>
        <section>
          <h4>删除确认弹窗</h4>
          <p>危险操作统一说明对象和不可恢复后果。</p>
          <DeleteConfirmAction
            entityName="记录"
            targetName="模板示例001"
            successMessage={false}
            onConfirm={() => undefined}
          >
            打开删除确认
          </DeleteConfirmAction>
        </section>
        <section>
          <h4>表单抽屉</h4>
          <p>用于不离开当前页面的新增、编辑和补充信息。</p>
          <AdminButton onClick={() => setFormDrawerOpen(true)}>打开表单抽屉</AdminButton>
        </section>
        <section>
          <h4>表格抽屉</h4>
          <p>关联列表统一使用 TemplateDrawerTable。</p>
          <AdminButton onClick={() => setTableDrawerOpen(true)}>打开模板表格抽屉</AdminButton>
        </section>
      </div>

      <AdminModal
        title="补充处理说明"
        open={modalOpen}
        size="small"
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          setModalOpen(false);
          message.success('普通弹窗模板已确认');
        }}
      >
        <AdminTextArea rows={4} placeholder="请输入处理说明" />
      </AdminModal>

      <StatusFlowModal<string>
        title="状态变更"
        open={statusOpen}
        currentValue="待处理"
        targetValue={targetStatus}
        targetOptions={[
          { label: '处理中', value: 'processing' },
          { label: '已完成', value: 'completed' },
          { label: '已关闭', value: 'closed' }
        ]}
        targetText={targetStatus === 'processing' ? '处理中' : targetStatus === 'completed' ? '已完成' : targetStatus === 'closed' ? '已关闭' : '-'}
        onTargetChange={setTargetStatus}
        onCancel={() => {
          setStatusOpen(false);
          setTargetStatus(undefined);
        }}
        onConfirm={() => {
          setStatusOpen(false);
          setTargetStatus(undefined);
          message.success('状态变更模板已确认');
        }}
      />

      <AdminDrawer
        title="编辑补充信息"
        width={620}
        open={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        footer={(
          <AdminSpace>
            <AdminButton onClick={() => setFormDrawerOpen(false)}>取消</AdminButton>
            <AdminButton type="primary" onClick={() => setFormDrawerOpen(false)}>确认</AdminButton>
          </AdminSpace>
        )}
      >
        <div className="overlay-template-demo__drawer-form">
          <label>
            <span>问题描述</span>
            <AdminInput placeholder="请输入问题描述" />
          </label>
          <label>
            <span>问题类型</span>
            <AdminSelect placeholder="请选择问题类型" options={[{ label: '日常操作', value: 'daily' }, { label: '故障报障', value: 'fault' }]} />
          </label>
          <label className="is-wide">
            <span>处理备注</span>
            <AdminTextArea rows={4} placeholder="请输入处理备注" />
          </label>
        </div>
      </AdminDrawer>

      <TemplateDrawerTable<OverlayTableRecord>
        title="关联记录"
        width="calc(100vw - 180px)"
        open={tableDrawerOpen}
        onClose={() => setTableDrawerOpen(false)}
        description="抽屉内列表沿用标准列表的筛选、排序、分页和表格设置。"
        list={{
          mode: 'standard',
          filter: (
            <CompactFilterBar
              visibleCount={1}
              items={[{
                key: 'keyword',
                label: '问题描述',
                node: <AdminInput value={draftKeyword} placeholder="请输入" onChange={(event) => setDraftKeyword(event.target.value)} onPressEnter={() => setKeyword(draftKeyword)} />
              }]}
              onSearch={() => setKeyword(draftKeyword)}
              onReset={() => {
                setDraftKeyword('');
                setKeyword('');
              }}
            />
          ),
          table: {
            columns,
            dataSource: pagedRows,
            preferenceKey: 'design-system:overlay-template-drawer',
            pagination: false,
            search: false,
            scroll: { x: 720 },
            onChange: handleTableChange
          },
          pagination
        }}
      />
    </div>
  );
}
