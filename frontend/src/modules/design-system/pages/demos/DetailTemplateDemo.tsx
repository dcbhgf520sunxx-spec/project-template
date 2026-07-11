import { useState } from 'react';
import {
  AdminButton,
  AdminSegmented,
  DetailNeighborNav,
  DetailMetaList,
  StatusTag,
  TemplateDetailPage,
  TemplateDetailSection
} from '../../../../components/admin';
import { ComponentEntry } from '../components/ComponentEntry';

export function DetailTemplateDemo() {
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'error' | 'notFound'>('normal');

  return (
    <div className="design-system-page__layout-pattern-template">
      <div className="design-system-page__input-panel-head">
        <h3>TemplateDetailPage</h3>
        <ComponentEntry name="TemplateDetailPage / DetailNeighborNav / TemplateDetailSection / DetailMetaList" />
        <p>详情页统一从这个入口接入。上一条/下一条放标题栏中间，左侧保留标题和状态，右侧保留页面操作。</p>
        <div className="design-system-page__template-mode-switch">
          <AdminSegmented
            size="small"
            value={demoState}
            options={[
              { label: '正常', value: 'normal' },
              { label: '加载中', value: 'loading' },
              { label: '加载失败', value: 'error' },
              { label: '记录不存在', value: 'notFound' }
            ]}
            onChange={(value) => setDemoState(value as typeof demoState)}
          />
        </div>
      </div>
      <div className="design-system-page__template-demo is-detail">
        <TemplateDetailPage
          title="详情模板：用户详情"
          loading={demoState === 'loading'}
          error={demoState === 'error' ? '详情数据加载失败，请稍后重试' : undefined}
          notFound={demoState === 'notFound'}
          onRetry={() => setDemoState('normal')}
          onBack={() => {}}
          titleExtra={<StatusTag status="enabled" />}
          titleCenter={(
            <DetailNeighborNav
              placement="title"
              prevId="10085"
              nextId="10087"
              ordinal={8}
              total={24}
              onNavigate={() => {}}
            />
          )}
          actions={<AdminButton type="primary">编辑</AdminButton>}
          statusSection={{
            items: [
              { label: '状态', value: <StatusTag status="enabled" />, wide: true },
              { label: '最近登录', value: '2026-07-04 09:30', wide: true }
            ]
          }}
          documentSection={{
            items: [
              { label: '创建人', value: '系统管理员' },
              { label: '创建时间', value: '2026-06-30 10:12', wide: true },
              { label: '更新人', value: '业务管理员' },
              { label: '更新时间', value: '2026-07-04 09:00', wide: true }
            ]
          }}
        >
          <TemplateDetailSection title="基本信息">
            <DetailMetaList
              items={[
                { label: '工号', value: '10086' },
                { label: '姓名', value: '张三' },
                { label: '手机号', value: '13800000000' },
                { label: '所属角色', value: '系统管理员 / 业务管理员' }
              ]}
            />
          </TemplateDetailSection>
          <TemplateDetailSection title="权限范围">
            <DetailMetaList
              items={[
                { label: '管理范围', value: '用户、角色、运维工单', wide: true },
                { label: '数据权限', value: '本部门及下级部门' },
                { label: '账号来源', value: 'HR 同步' }
              ]}
            />
          </TemplateDetailSection>
        </TemplateDetailPage>
      </div>
    </div>
  );
}
