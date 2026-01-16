# WeChatAuthService

微信授权服务类，用于处理微信OAuth 2.0授权流程。

## 功能

- 生成微信授权URL
- 使用授权码换取access_token
- 获取用户信息（openid、昵称、头像）
- 刷新access_token

## 配置

在 `.env` 文件中配置以下环境变量：

```env
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://localhost:3000/api/wechat/callback
```

## 使用示例

### 1. 创建服务实例

```typescript
import { WeChatAuthService } from './WeChatAuthService';

// 使用环境变量
const authService = new WeChatAuthService();

// 或者手动指定配置
const authService = new WeChatAuthService(
  'your_app_id',
  'your_app_secret',
  'http://localhost:3000/api/wechat/callback'
);
```

### 2. 生成授权URL

```typescript
// 生成授权URL，sessionId作为state参数
const sessionId = 'session-123';
const authUrl = authService.getAuthUrl(sessionId);

// 返回的URL格式：
// https://open.weixin.qq.com/connect/oauth2/authorize?appid=...&redirect_uri=...&response_type=code&scope=snsapi_userinfo&state=session-123#wechat_redirect
```

### 3. 处理授权回调

```typescript
// 在回调端点中处理授权码
app.get('/api/wechat/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    // 使用授权码获取用户信息
    const userInfo = await authService.handleCallback(code as string);
    
    // userInfo 包含：
    // {
    //   openid: string,
    //   nickname: string,
    //   headimgurl: string,
    //   unionid?: string
    // }
    
    res.json({
      userInfo,
      sessionId: state,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Authorization failed',
      message: error.message,
    });
  }
});
```

### 4. 刷新access_token

```typescript
try {
  const newAccessToken = await authService.refreshAccessToken(refreshToken);
  console.log('New access token:', newAccessToken);
} catch (error) {
  console.error('Failed to refresh token:', error.message);
}
```

## OAuth 2.0 流程

1. **生成授权URL**: 调用 `getAuthUrl(sessionId)` 生成授权URL
2. **用户授权**: 用户在微信中同意授权
3. **接收授权码**: 微信重定向到回调URL，携带授权码（code）
4. **换取access_token**: 调用 `handleCallback(code)` 自动完成以下步骤：
   - 使用授权码换取access_token
   - 使用access_token获取用户信息
   - 返回用户信息

## 错误处理

所有方法在失败时都会抛出错误，错误信息包含：

- 微信API错误：`WeChat API error: {errcode} - {errmsg}`
- 网络错误：`Failed to get access token: {error message}`
- 数据验证错误：`Invalid response from WeChat API: missing required fields`

## 验证需求

- **需求 9.1**: 生成授权URL（包含appId、redirectUri、state）
- **需求 9.2**: 接收微信返回的授权码
- **需求 9.3**: 使用授权码换取access_token
- **需求 9.4**: 使用access_token获取用户信息
- **需求 9.5**: 返回openid、昵称和头像URL
- **需求 9.6**: 返回明确的错误信息

## 测试

运行单元测试：

```bash
npm test -- WeChatAuthService.test.ts
```

测试覆盖：
- 授权URL生成
- 成功的授权流程
- 各种错误场景（API错误、网络错误、数据验证错误）
- token刷新
- 环境变量配置
