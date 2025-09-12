import {
  ClockCircleOutlined,
  BugOutlined,
  AppstoreOutlined,
  RocketOutlined,
  EditOutlined,
  InboxOutlined,
  DeleteOutlined,
  GlobalOutlined,
  LockOutlined,
} from "@ant-design/icons-vue";

export interface ProjectRecord {
  id: string;
  key: string;
  name: string;
  description?: string;
  visibility: "public" | "private";
  archived?: boolean;
}

export interface ColumnProps {
  canManageProject: boolean;
  onGoDetail: (record: ProjectRecord) => void;
  onGoIssues: (record: ProjectRecord) => void;
  onGoHours: (record: ProjectRecord) => void;
  onGoKanban: (record: ProjectRecord) => void;
  onGoReleases: (record: ProjectRecord) => void;
  onEdit: (record: ProjectRecord) => void;
  onToggleArchive: (record: ProjectRecord) => void;
  onRemoveProject: (record: ProjectRecord) => void;
}

export const useProjectColumns = (props: ColumnProps) => {
  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      sorter: true,
      key: "name",
    },
    {
      title: "可见性",
      dataIndex: "visibility",
      key: "visibility",
    },
    {
      title: "操作",
      key: "action",
      width: 200,
    },
  ];

  const renderBodyCell = (column: any, record: ProjectRecord) => {
    if (column.key === "key") {
      return (
        <div class="project-key">
          <a-tag color="blue" class="key-tag">
            {record.key}
          </a-tag>
        </div>
      );
    }

    if (column.dataIndex === "name") {
      return (
        <div class="project-name">
          <a class="name-text" onClick={() => props.onGoDetail(record)}>
            {record.name}
          </a>
          {record.description && (
            <div class="name-desc">{record.description}</div>
          )}
        </div>
      );
    }

    if (column.key === "visibility") {
      return (
        <a-tag
          color={record.visibility === "public" ? "green" : "orange"}
          class="visibility-tag"
        >
          {record.visibility === "public" ? (
            <GlobalOutlined />
          ) : (
            <LockOutlined />
          )}
          {record.visibility === "public" ? "Public" : "Private"}
        </a-tag>
      );
    }

    if (column.key === "action") {
      return (
        <div class="action-buttons">
          <a-space>
            <a-button
              type="text"
              key="hours"
              onClick={() => props.onGoHours(record)}
            >
              <ClockCircleOutlined />
              工时报表
            </a-button>
            <a-button
              type="text"
              key="issues"
              onClick={() => props.onGoIssues(record)}
            >
              <BugOutlined />
              事项管理
            </a-button>

            <a-button
              type="text"
              key="kanban"
              onClick={() => props.onGoKanban(record)}
            >
              <AppstoreOutlined />
              看板视图
            </a-button>
          </a-space>
          <a-dropdown>
            {{
              overlay: () => (
                <a-menu>
                  <a-menu-item
                    key="hours"
                    onClick={() => props.onGoHours(record)}
                  >
                    <ClockCircleOutlined />
                    工时报表
                  </a-menu-item>
                  <a-menu-item
                    key="releases"
                    onClick={() => props.onGoReleases(record)}
                  >
                    <RocketOutlined />
                    发布管理
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item
                    key="edit"
                    disabled={!props.canManageProject}
                    onClick={() =>
                      props.canManageProject && props.onEdit(record)
                    }
                  >
                    <EditOutlined />
                    编辑项目
                  </a-menu-item>
                  <a-menu-item
                    key="archive"
                    disabled={!props.canManageProject}
                    onClick={() =>
                      props.canManageProject && props.onToggleArchive(record)
                    }
                  >
                    <InboxOutlined />
                    {record.archived ? "取消归档" : "归档项目"}
                  </a-menu-item>
                  <a-menu-item
                    key="delete"
                    disabled={!props.canManageProject}
                    onClick={() =>
                      props.canManageProject && props.onRemoveProject(record)
                    }
                    class="danger-item"
                  >
                    <DeleteOutlined />
                    删除项目
                  </a-menu-item>
                </a-menu>
              ),
              default: () => (
                <a-button type="text" class="action-btn">
                  {" "}
                  操作{" "}
                </a-button>
              ),
            }}
          </a-dropdown>
        </div>
      );
    }

    return null;
  };

  return {
    columns,
    renderBodyCell,
  };
};
