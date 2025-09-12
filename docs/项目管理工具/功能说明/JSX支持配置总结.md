# JSX/TSX 支持配置总结

## 概述
成功为Vue 3项目添加了完整的JSX/TSX支持，允许开发者使用JSX语法编写Vue组件，提供更灵活的组件开发方式。

## 🔧 技术配置

### 1. 依赖安装
```bash
npm install @vitejs/plugin-vue-jsx --save-dev
```

### 2. Vite配置 (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

export default defineConfig({
  plugins: [
    vue(),
    vueJsx({
      // 配置选项
      transformOn: true,    // 启用 v-on 指令转换
      mergeProps: true,     // 启用属性合并
    })
  ],
  esbuild: {
    jsx: 'automatic',      // 自动JSX转换
  },
});
```

### 3. TypeScript配置 (tsconfig.json)
```json
{
  "compilerOptions": {
    "jsx": "preserve",           // 保留JSX语法
    "jsxImportSource": "vue",    // 指定JSX导入源
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": [
    "src/**/*.ts", 
    "src/**/*.d.ts", 
    "src/**/*.tsx", 
    "src/**/*.jsx", 
    "src/**/*.vue"
  ]
}
```

## 📝 JSX组件示例

### 1. 基础JSX组件 (JSXExample.tsx)
```typescript
import { defineComponent, ref, computed } from 'vue';
import { Button, Card, Space, Tag, message } from 'ant-design-vue';
import { PlusOutlined, HeartOutlined, StarOutlined } from '@ant-design/icons-vue';

export default defineComponent({
  name: 'JSXExample',
  setup() {
    const count = ref(0);
    const liked = ref(false);
    const starred = ref(false);

    const doubleCount = computed(() => count.value * 2);

    const handleIncrement = () => {
      count.value++;
      message.success(`计数增加到 ${count.value}`);
    };

    return () => (
      <div class="jsx-example">
        <Card title="JSX 示例组件">
          <Space direction="vertical" size="large">
            <div class="counter-section">
              <h3>计数器示例</h3>
              <p>当前计数: <Tag color="blue">{count.value}</Tag></p>
              <p>双倍计数: <Tag color="green">{doubleCount.value}</Tag></p>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleIncrement}
              >
                增加计数
              </Button>
            </div>
          </Space>
        </Card>
      </div>
    );
  }
});
```

### 2. 复杂JSX组件 (ProjectCard.tsx)
```typescript
import { defineComponent, ref, computed } from 'vue';
import { Card, Button, Tag, Space, Avatar, Dropdown, Menu } from 'ant-design-vue';

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
  setup(props) {
    const hovered = ref(false);

    const visibilityColor = computed(() => 
      props.project.visibility === 'public' ? 'green' : 'orange'
    );

    return () => (
      <Card
        hoverable
        class={['project-card', { 'project-card--hovered': hovered.value }]}
        onClick={() => props.onView?.(props.project)}
      >
        <div class="project-card__header">
          <div class="project-card__title">
            <Space>
              <Tag color="blue">{props.project.key}</Tag>
              <h3>{props.project.name}</h3>
            </Space>
          </div>
        </div>
        {/* 更多内容... */}
      </Card>
    );
  }
});
```

### 3. 看板JSX组件 (KanbanBoard.tsx)
```typescript
import { defineComponent, ref, computed } from 'vue';
import { Card, Button, Tag, Space, Input, Empty } from 'ant-design-vue';

interface Issue {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: string;
  assigneeName?: string;
  state: string;
}

interface Column {
  id: string;
  name: string;
  color: string;
  wipLimit?: number;
  issues: Issue[];
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
    }
  },
  setup(props) {
    const searchText = ref('');
    const draggedIssue = ref<Issue | null>(null);

    const filteredColumns = computed(() => {
      if (!searchText.value.trim()) {
        return props.columns;
      }
      
      const searchTerm = searchText.value.toLowerCase();
      return props.columns.map(column => ({
        ...column,
        issues: column.issues.filter(issue => 
          issue.title.toLowerCase().includes(searchTerm) ||
          issue.description?.toLowerCase().includes(searchTerm)
        )
      }));
    });

    return () => (
      <div class="kanban-board">
        <div class="kanban-toolbar">
          <Space>
            <Input
              v-model={[searchText.value, 'value']}
              placeholder="搜索事项..."
              prefix={<SearchOutlined />}
            />
            <Button icon={<ReloadOutlined />}>
              刷新
            </Button>
          </Space>
        </div>

        <div class="kanban-columns">
          {filteredColumns.value.map(column => (
            <div key={column.id} class="kanban-column">
              <div class="column-header">
                <span class="column-name">{column.name}</span>
                <Tag color="blue">
                  {column.issues.length}{column.wipLimit ? `/${column.wipLimit}` : ''}
                </Tag>
              </div>
              <div class="column-content">
                {column.issues.map(issue => (
                  <Card key={issue.id} class="kanban-card">
                    <div class="card-title">{issue.title}</div>
                    <div class="card-footer">
                      {issue.assigneeName ? (
                        <Avatar size="small">{issue.assigneeName.charAt(0)}</Avatar>
                      ) : (
                        <span>未分配</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
});
```

## 🎯 JSX特性支持

### 1. 基础语法
- ✅ **JSX元素**：`<div>`, `<span>`, `<button>` 等
- ✅ **组件引用**：`<MyComponent />`
- ✅ **属性绑定**：`<Button type="primary" size="large" />`
- ✅ **事件处理**：`<Button onClick={handleClick} />`
- ✅ **条件渲染**：`{condition ? <ComponentA /> : <ComponentB />}`
- ✅ **列表渲染**：`{items.map(item => <Item key={item.id} />)}`

### 2. Vue 3 特性
- ✅ **响应式数据**：`ref()`, `reactive()`, `computed()`
- ✅ **生命周期**：`onMounted()`, `onUnmounted()` 等
- ✅ **Props定义**：TypeScript接口定义
- ✅ **事件发射**：`emit()` 函数
- ✅ **插槽支持**：`<slot />` 或具名插槽

### 3. Ant Design Vue 集成
- ✅ **组件使用**：所有Ant Design Vue组件
- ✅ **图标支持**：`@ant-design/icons-vue`
- ✅ **主题定制**：支持主题配置
- ✅ **类型安全**：完整的TypeScript支持

## 📁 文件结构

```
client/src/
├── components/
│   ├── JSXExample.tsx          # 基础JSX示例
│   ├── ProjectCard.tsx         # 项目卡片组件
│   └── KanbanBoard.tsx         # 看板组件
├── views/
│   └── JSXTest.vue             # JSX测试页面
├── vite.config.ts              # Vite配置
├── tsconfig.json               # TypeScript配置
└── package.json                # 依赖配置
```

## 🚀 使用方式

### 1. 在Vue组件中使用JSX组件
```vue
<template>
  <div>
    <JSXExample />
    <ProjectCard 
      :project="project" 
      @view="handleView" 
    />
  </div>
</template>

<script setup lang="ts">
import JSXExample from '../components/JSXExample';
import ProjectCard from '../components/ProjectCard';
</script>
```

### 2. 直接使用JSX语法
```typescript
// 在setup函数中返回JSX
setup() {
  const count = ref(0);
  
  return () => (
    <div>
      <h1>计数: {count.value}</h1>
      <Button onClick={() => count.value++}>
        增加
      </Button>
    </div>
  );
}
```

## 🔍 调试和开发

### 1. 开发服务器
```bash
npm run dev
```
- 支持热重载
- 自动编译TSX/JSX文件
- 实时错误提示

### 2. 类型检查
```bash
npx tsc --noEmit
```
- 完整的TypeScript类型检查
- JSX语法验证
- 组件属性类型验证

### 3. 构建
```bash
npm run build
```
- 生产环境构建
- JSX/TSX文件编译
- 代码优化和压缩

## 📊 优势对比

### JSX vs Template

| 特性 | JSX | Template |
|------|-----|----------|
| **类型安全** | ✅ 完整支持 | ⚠️ 部分支持 |
| **逻辑表达** | ✅ 原生JavaScript | ⚠️ 模板语法 |
| **组件复用** | ✅ 函数式组件 | ⚠️ 模板组件 |
| **调试体验** | ✅ 原生调试 | ⚠️ 模板调试 |
| **学习成本** | ⚠️ 需要JSX知识 | ✅ Vue模板语法 |
| **性能** | ✅ 编译时优化 | ✅ 运行时优化 |

## 🎨 最佳实践

### 1. 组件设计
```typescript
// 使用TypeScript接口定义Props
interface Props {
  title: string;
  count: number;
  onUpdate?: (value: number) => void;
}

// 使用defineComponent获得更好的类型支持
export default defineComponent({
  name: 'MyComponent',
  props: {
    title: String,
    count: Number,
    onUpdate: Function
  },
  setup(props: Props) {
    // 组件逻辑
    return () => (
      <div>
        <h1>{props.title}</h1>
        <span>{props.count}</span>
      </div>
    );
  }
});
```

### 2. 事件处理
```typescript
// 使用类型安全的事件处理
const handleClick = (event: MouseEvent) => {
  console.log('点击事件', event);
};

return () => (
  <Button onClick={handleClick}>
    点击我
  </Button>
);
```

### 3. 条件渲染
```typescript
// 使用JavaScript表达式进行条件渲染
return () => (
  <div>
    {isLoading.value ? (
      <Spin size="large" />
    ) : (
      <div>内容已加载</div>
    )}
  </div>
);
```

## 🔮 未来扩展

### 1. 更多JSX特性
- 自定义JSX工厂函数
- JSX片段支持
- 动态组件渲染

### 2. 工具链优化
- ESLint规则配置
- Prettier格式化支持
- 代码生成工具

### 3. 性能优化
- 组件懒加载
- 虚拟滚动支持
- 内存优化

## 总结

通过添加JSX/TSX支持，项目现在具备了：

1. **更灵活的组件编写方式**：可以使用JSX语法编写Vue组件
2. **更好的TypeScript支持**：完整的类型安全和智能提示
3. **更强大的逻辑表达**：原生JavaScript表达式和函数
4. **更好的开发体验**：现代化的开发工具链
5. **更高的代码复用性**：函数式组件和逻辑复用

JSX支持为Vue 3项目提供了更多的开发选择，特别适合复杂逻辑的组件开发和团队协作。
