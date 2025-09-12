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

    const handleLike = () => {
      liked.value = !liked.value;
      message.info(liked.value ? '已点赞' : '取消点赞');
    };

    const handleStar = () => {
      starred.value = !starred.value;
      message.info(starred.value ? '已收藏' : '取消收藏');
    };

    return () => (
      <div class="jsx-example">
        <Card title="JSX 示例组件" style={{ margin: '20px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
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

            <div class="interaction-section">
              <h3>交互示例</h3>
              <Space>
                <Button 
                  type={liked.value ? 'primary' : 'default'}
                  icon={<HeartOutlined />}
                  onClick={handleLike}
                >
                  {liked.value ? '已点赞' : '点赞'}
                </Button>
                <Button 
                  type={starred.value ? 'primary' : 'default'}
                  icon={<StarOutlined />}
                  onClick={handleStar}
                >
                  {starred.value ? '已收藏' : '收藏'}
                </Button>
              </Space>
            </div>

            <div class="list-section">
              <h3>列表渲染示例</h3>
              <ul>
                {Array.from({ length: count.value }, (_, index) => (
                  <li key={index}>
                    项目 {index + 1} - 计数: {count.value}
                  </li>
                ))}
              </ul>
            </div>

            <div class="conditional-section">
              <h3>条件渲染示例</h3>
              {count.value > 5 ? (
                <Tag color="red">计数超过5了！</Tag>
              ) : count.value > 0 ? (
                <Tag color="orange">计数大于0</Tag>
              ) : (
                <Tag color="gray">计数为0</Tag>
              )}
            </div>
          </Space>
        </Card>
      </div>
    );
  }
});
