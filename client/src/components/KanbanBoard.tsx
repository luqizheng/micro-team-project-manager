import { defineComponent, ref, computed, onMounted } from 'vue';
import { Card, Button, Tag, Space, Input, Select, Dropdown, Menu, Empty } from 'ant-design-vue';
import { 
  SearchOutlined, 
  PlusOutlined, 
  ReloadOutlined,
  SettingOutlined,
  DragOutlined,
  EyeOutlined,
  EditOutlined,
  CopyOutlined
} from '@ant-design/icons-vue';

interface Issue {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  assigneeName?: string;
  estimatedHours?: number;
  dueAt?: string;
  state: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  wipLimit?: number;
  issues: Issue[];
}

interface Props {
  columns: Column[];
  loading?: boolean;
  onRefresh?: () => void;
  onConfigure?: () => void;
  onCreateIssue?: (columnId: string) => void;
  onViewIssue?: (issue: Issue) => void;
  onEditIssue?: (issue: Issue) => void;
  onDuplicateIssue?: (issue: Issue) => void;
  onMoveIssue?: (issueId: string, columnId: string) => void;
}

export default defineComponent({
  name: 'KanbanBoard',
  props: {
    columns: {
      type: Array as () => Column[],
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    onRefresh: Function,
    onConfigure: Function,
    onCreateIssue: Function,
    onViewIssue: Function,
    onEditIssue: Function,
    onDuplicateIssue: Function,
    onMoveIssue: Function
  },
  setup(props: Props) {
    const searchText = ref('');
    const draggedIssue = ref<Issue | null>(null);
    const dragOverColumn = ref<string | null>(null);

    const filteredColumns = computed(() => {
      if (!searchText.value.trim()) {
        return props.columns;
      }
      
      const searchTerm = searchText.value.toLowerCase();
      return props.columns.map(column => ({
        ...column,
        issues: column.issues.filter(issue => 
          issue.title.toLowerCase().includes(searchTerm) ||
          issue.description?.toLowerCase().includes(searchTerm) ||
          issue.assigneeName?.toLowerCase().includes(searchTerm)
        )
      }));
    });

    const getTypeColor = (type: string) => {
      const colors: Record<string, string> = {
        'bug': 'red',
        'feature': 'blue',
        'task': 'green',
        'story': 'purple'
      };
      return colors[type] || 'default';
    };

    const getTypeName = (type: string) => {
      const names: Record<string, string> = {
        'bug': '缺陷',
        'feature': '功能',
        'task': '任务',
        'story': '故事'
      };
      return names[type] || type;
    };

    const getWipColor = (column: Column) => {
      if (!column.wipLimit) return 'blue';
      const count = column.issues.length;
      if (count >= column.wipLimit) return 'red';
      if (count >= column.wipLimit * 0.8) return 'orange';
      return 'green';
    };

    const getWipStatus = (column: Column) => {
      if (!column.wipLimit) return '';
      const count = column.issues.length;
      if (count >= column.wipLimit) return '已满';
      if (count >= column.wipLimit * 0.8) return '接近限制';
      return '正常';
    };

    const handleDragStart = (event: DragEvent, issue: Issue) => {
      draggedIssue.value = issue;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    };

    const handleDragEnd = () => {
      draggedIssue.value = null;
      dragOverColumn.value = null;
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    };

    const handleDragEnter = (event: DragEvent, columnId: string) => {
      event.preventDefault();
      dragOverColumn.value = columnId;
    };

    const handleDrop = (event: DragEvent, column: Column) => {
      event.preventDefault();
      if (!draggedIssue.value) return;

      const currentColumn = props.columns.find(col => 
        col.issues.some(issue => issue.id === draggedIssue.value?.id)
      );

      if (currentColumn?.id === column.id) return;

      // 检查WIP限制
      if (column.wipLimit && column.issues.length >= column.wipLimit) {
        return;
      }

      props.onMoveIssue?.(draggedIssue.value.id, column.id);
      handleDragEnd();
    };

    const handleIssueAction = (action: string, issue: Issue) => {
      switch (action) {
        case 'view':
          props.onViewIssue?.(issue);
          break;
        case 'edit':
          props.onEditIssue?.(issue);
          break;
        case 'duplicate':
          props.onDuplicateIssue?.(issue);
          break;
      }
    };

    return () => (
      <div class="kanban-board">
        {/* 工具栏 */}
        <div class="kanban-toolbar">
          <Space>
            <Input
              v-model={[searchText.value, 'value']}
              placeholder="搜索事项..."
              prefix={<SearchOutlined />}
              style={{ width: '200px' }}
            />
            <Button 
              icon={<ReloadOutlined />}
              onClick={props.onRefresh}
            >
              刷新
            </Button>
            <Button 
              type="primary"
              icon={<SettingOutlined />}
              onClick={props.onConfigure}
            >
              看板配置
            </Button>
          </Space>
        </div>

        {/* 看板列 */}
        <div class="kanban-columns">
          {filteredColumns.value.map(column => (
            <div 
              key={column.id}
              class={['kanban-column', { 'drag-over': dragOverColumn.value === column.id }]}
              style={{ borderColor: column.color }}
              onDrop={(e: DragEvent) => handleDrop(e, column)}
              onDragover={handleDragOver}
              onDragenter={(e: DragEvent) => handleDragEnter(e, column.id)}
            >
              {/* 列头 */}
              <div class="column-header">
                <div class="column-title">
                  <span class="column-name">{column.name}</span>
                  <div class="column-stats">
                    <Tag color={getWipColor(column)} size="small">
                      {column.issues.length}{column.wipLimit ? `/${column.wipLimit}` : ''}
                    </Tag>
                    {column.wipLimit && (
                      <Tag color={getWipColor(column)} size="small">
                        {getWipStatus(column)}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* 列内容 */}
              <div class="column-content">
                {column.issues.map(issue => (
                  <Card
                    key={issue.id}
                    class="kanban-card"
                    draggable
                    onDragstart={(e: DragEvent) => handleDragStart(e, issue)}
                    onDragend={handleDragEnd}
                    onClick={() => props.onViewIssue?.(issue)}
                    style={{ marginBottom: '8px' }}
                  >
                    <div class="card-header">
                      <Space>
                        <Tag color={getTypeColor(issue.type)} size="small">
                          {getTypeName(issue.type)}
                        </Tag>
                        <span class="issue-id">#{issue.id.slice(-8)}</span>
                      </Space>
                      <Dropdown
                        trigger={['click']}
                        overlay={
                          <Menu
                            items={[
                              { key: 'view', label: '查看详情', icon: <EyeOutlined /> },
                              { key: 'edit', label: '编辑', icon: <EditOutlined /> },
                              { key: 'duplicate', label: '复制', icon: <CopyOutlined /> }
                            ]}
                            onClick={({ key }) => handleIssueAction(key, issue)}
                          />
                        }
                        onClick={(e: Event) => e.stopPropagation()}
                      >
                        <Button type="text" size="small">
                          <DragOutlined />
                        </Button>
                      </Dropdown>
                    </div>
                    <div class="card-title">{issue.title}</div>
                    <div class="card-footer">
                      <Space>
                        {issue.assigneeName ? (
                          <Avatar size="small">{issue.assigneeName.charAt(0)}</Avatar>
                        ) : (
                          <span class="no-assignee">未分配</span>
                        )}
                        {issue.estimatedHours && (
                          <span class="hours">{issue.estimatedHours}h</span>
                        )}
                      </Space>
                    </div>
                  </Card>
                ))}

                {/* 添加事项按钮 */}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => props.onCreateIssue?.(column.id)}
                  class="add-card"
                >
                  添加事项
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredColumns.value.length === 0 && (
          <Empty description="暂无看板数据" />
        )}
      </div>
    );
  }
});
