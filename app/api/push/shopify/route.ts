import { NextResponse } from 'next/server';
// 引入 MoePush 核心的推送方法（根据 MoePush 源码结构，通常在 api/push/route.ts 同级或上级，请根据实际导入路径调整）
import { handlePush } from '../route'; 

export async function POST(request: Request) {
  try {
    // 1. 解析 Shopify 原始数据
    const shopifyPayload = await request.json();
    
    // 2. 提取并清洗字段
    const orderName = shopifyPayload.name || '未知单号';
    const totalPrice = shopifyPayload.total_price || '0.00';
    const currency = shopifyPayload.currency || 'USD';
    const email = shopifyPayload.email || '无';
    
    const lineItems = shopifyPayload.line_items || [];
    const itemsText = lineItems.slice(0, 3).map((item: any) => 
      `• ${item.title} (x${item.quantity})`
    ).join('\n');
    
    // 3. 从 URL 中获取 MoePush 自身的 接口 Key (不是飞书的 Key)
    const { searchParams } = new URL(request.url);
    const moepushKey = searchParams.get('key'); 

    if (!moepushKey) {
      return NextResponse.json({ error: '缺少 MoePush 接口 Key' }, { status: 400 });
    }

    // 4. 构造符合 MoePush 接收标准的通用文本格式
    const title = `🛒 Shopify 新订单: ${orderName}`;
    const content = `订单金额: ${totalPrice} ${currency}\n客户邮箱: ${email}\n商品明细:\n${itemsText}`;

    /**
     * 5. 核心：模拟一次标准请求，直接触发 MoePush 的内部推送逻辑
     * 这样数据才会进入 MoePush 的数据库、展示在后台历史记录中，并走你在后台配置的飞书渠道
     */
    const internalRequest = new Request(`https://localhost/api/push?key=${moepushKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });

    // 执行 MoePush 的原生处理函数
    const moepushResponse = await handlePush(internalRequest);
    return moepushResponse;

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 兼容某些版本的标准命名
export { POST as handleShopifyPush };
