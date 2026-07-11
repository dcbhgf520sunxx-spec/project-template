import { useEffect, useState } from 'react';
import type { Key } from 'react';
import { message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AdminTree,
  DeleteConfirmAction,
  DetailMetaList,
  PermissionButton,
  TemplateDetailPage,
  TemplateDetailSection
} from '../../../components/admin';
import {
  deleteRole,
  getMenuList,
  getRole,
  getRoleMenuIds,
  type MenuRecord,
  type RoleRecord
} from '../../../api/roleApi';

function buildMenuTree(menus: MenuRecord[]): DataNode[] {
  const nodeMap = new Map<number, DataNode>();
  const roots: DataNode[] = [];

  menus.forEach((menu) => {
    nodeMap.set(menu.id, { key: menu.id, title: menu.name, children: [] });
  });

  menus.forEach((menu) => {
    const node = nodeMap.get(menu.id);
    if (!node) return;
    if (menu.parent_id === 0) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(menu.parent_id);
      if (parent) parent.children = [...(parent.children || []), node];
    }
  });

  return roots;
}

function collectTreeKeys(nodes: DataNode[]): Key[] {
  return nodes.flatMap((node) => [
    node.key,
    ...collectTreeKeys(node.children || [])
  ]);
}

export function RoleDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [role, setRole] = useState<RoleRecord>();
  const [menuTree, setMenuTree] = useState<DataNode[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<number[]>([]);
  const [expandedMenuIds, setExpandedMenuIds] = useState<Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reloadRevision, setReloadRevision] = useState(0);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setLoadError('');
    setNotFound(false);
    setRole(undefined);
    Promise.all([
      getRole(params.id).then(setRole),
      getMenuList().then((menus) => {
        const tree = buildMenuTree(menus);
        setMenuTree(tree);
        setExpandedMenuIds(collectTreeKeys(tree));
      }),
      getRoleMenuIds(params.id).then(setCheckedMenuIds)
    ]).catch((error) => {
      const messageText = error instanceof Error ? error.message : '角色加载失败';
      if (messageText.includes('不存在')) setNotFound(true);
      else setLoadError(messageText);
    }).finally(() => setLoading(false));
  }, [params.id, reloadRevision]);

  return (
    <TemplateDetailPage
      title="角色详情"
      loading={loading}
      error={loadError}
      notFound={notFound}
      onRetry={() => setReloadRevision((value) => value + 1)}
      onBack={() => navigate('/roles')}
      actions={
        <>
          {role ? (
            <PermissionButton type="primary" permission="role" onClick={() => navigate(`/roles/${role.id}/edit`)}>
              编辑
            </PermissionButton>
          ) : null}
          {role ? (
            <DeleteConfirmAction
              permission="role"
              entityName="角色"
              targetName={role.name}
              onConfirm={async () => {
                await deleteRole(role.id);
                message.success('删除成功');
                navigate('/roles');
              }}
              successMessage={false}
            >
              删除
            </DeleteConfirmAction>
          ) : null}
        </>
      }
      documentSection={role ? {
        items: [
          { label: '创建人', value: role.creatorName || '-' },
          { label: '创建时间', value: role.createdAt || '-', wide: true },
          { label: '更新人', value: role.updaterName || '-' },
          { label: '更新时间', value: role.updatedAt || '-', wide: true }
        ]
      } : null}
    >
      {role ? (
        <>
          <TemplateDetailSection title="基本信息">
            <DetailMetaList
              items={[
                { label: '角色编码', value: role.code },
                { label: '角色名称', value: role.name },
                { label: '权限范围', value: role.permissions || '-' },
                { label: '角色描述', value: role.description || '-', wide: true }
              ]}
            />
          </TemplateDetailSection>
          <TemplateDetailSection title="菜单权限">
            <AdminTree
              checkable
              disabled
              expandedKeys={expandedMenuIds}
              treeData={menuTree}
              checkedKeys={menuTree.length ? checkedMenuIds : []}
              onExpand={(keys) => setExpandedMenuIds(keys)}
            />
          </TemplateDetailSection>
        </>
      ) : null}
    </TemplateDetailPage>
  );
}
