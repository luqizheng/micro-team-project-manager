import { defineComponent, ref, computed } from 'vue';
import { Card, Button, Tag, Space, Avatar, Tooltip, Dropdown, Menu } from 'ant-design-vue';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  MoreOutlined,
  TeamOutlined,
  CalendarOutlined,
  FolderOutlined
} from '@ant-design/icons-vue';

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  visibility: 'public' | 'private';
  memberCount: number;
  createdAt: string;
  archived?: boolean;
}

interface Props {
  project: Project;
  onView?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onArchive?: (project: Project) => void;
}

export default defineComponent({
  name: 'ProjectCard',
  props: {
    project: {
      type: Object as () => Project,
      required: true
    },
    onView: Function,
    onEdit: Function,
    onDelete: Function,
    onArchive: Function
  },
  setup(props: Props) {
    const hovered = ref(false);

    const visibilityColor = computed(() => 
      props.project.visibility === 'public' ? 'green' : 'orange'
    );

    const visibilityText = computed(() => 
      props.project.visibility === 'public' ? 'Public' : 'Private'
    );

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('zh-CN');
    };

    const handleCardClick = () => {
      props.onView?.(props.project);
    };

    const handleMenuClick = ({ key }: { key: string }) => {
      switch (key) {
        case 'view':
          props.onView?.(props.project);
          break;
        case 'edit':
          props.onEdit?.(props.project);
          break;
        case 'archive':
          props.onArchive?.(props.project);
          break;
        case 'delete':
          props.onDelete?.(props.project);
          break;
      }
    };

    const menuItems = [
      {
        key: 'view',
        label: '查看详情',
        icon: <EyeOutlined />
      },
      {
        key: 'edit',
        label: '编辑项目',
        icon: <EditOutlined />
      },
      {
        key: 'archive',
        label: props.project.archived ? '取消归档' : '归档项目',
        icon: <FolderOutlined />
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        label: '删除项目',
        icon: <DeleteOutlined />,
        danger: true
      }
    ];

    return () => (
      <Card
        hoverable
        class={['project-card', { 'project-card--hovered': hovered.value }]}
        onMouseenter={() => hovered.value = true}
        onMouseleave={() => hovered.value = false}
        onClick={handleCardClick}
        style={{
          marginBottom: '16px',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
      >
        <div class="project-card__header">
          <div class="project-card__title">
            <Space>
              <Tag color="blue" class="project-key">
                {props.project.key}
              </Tag>
              <h3 class="project-name">{props.project.name}</h3>
            </Space>
          </div>
          <div class="project-card__actions">
            <Dropdown
              trigger={['click']}
              overlay={
                <Menu items={menuItems} onClick={handleMenuClick} />
              }
              onClick={(e: Event) => e.stopPropagation()}
            >
              <Button 
                type="text" 
                icon={<MoreOutlined />}
                class="action-btn"
              />
            </Dropdown>
          </div>
        </div>

        {props.project.description && (
          <p class="project-card__description">
            {props.project.description}
          </p>
        )}

        <div class="project-card__footer">
          <Space>
            <Tag color={visibilityColor.value}>
              {visibilityText.value}
            </Tag>
            <Space size="small">
              <TeamOutlined />
              <span>{props.project.memberCount} 成员</span>
            </Space>
            <Space size="small">
              <CalendarOutlined />
              <span>{formatDate(props.project.createdAt)}</span>
            </Space>
          </Space>
        </div>

        {props.project.archived && (
          <div class="project-card__badge">
            <Tag color="red">已归档</Tag>
          </div>
        )}
      </Card>
    );
  }
});
