import axios from 'axios';
import { WeChatUserInfo } from './types';

/**
 * 微信授权服务
 * 
 * 职责: 处理微信OAuth 2.0授权流程
 * 
 * OAuth流程:
 * 1. 生成授权URL（包含appId、redirectUri、state）
 * 2. 用户同意授权后，微信重定向到回调URL
 * 3. 使用授权码换取access_token
 * 4. 使用access_token获取用户信息
 * 5. 返回用户信息（openid、昵称、头像）
 */
export class WeChatAuthService {
  private appId: string;
  private appSecret: string;
  private redirectUri: string;

  constructor(appId?: string, appSecret?: string, redirectUri?: string) {
    this.appId = appId || process.env.WECHAT_APP_ID || '';
    this.appSecret = appSecret || process.env.WECHAT_APP_SECRET || '';
    this.redirectUri = redirectUri || process.env.WECHAT_REDIRECT_URI || '';

    if (!this.appId || !this.appSecret || !this.redirectUri) {
      console.warn('WeChat OAuth configuration is incomplete. Please set WECHAT_APP_ID, WECHAT_APP_SECRET, and WECHAT_REDIRECT_URI.');
    }
  }

  /**
   * 生成微信授权URL
   * 
   * @param sessionId - 会话ID，用作state参数
   * @returns 微信授权URL
   * 
   * 验证需求: 9.1
   */
  getAuthUrl(sessionId: string): string {
    // 微信网页授权URL
    const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize';

    // 构建授权URL参数
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'snsapi_userinfo', // 获取用户信息（需要用户授权）
      state: sessionId,
    });

    // 返回完整的授权URL（微信要求使用#wechat_redirect结尾）
    return `${baseUrl}?${params.toString()}#wechat_redirect`;
  }

  /**
   * 使用授权码换取access_token
   * 
   * @param code - 微信返回的授权码
   * @returns access_token和openid
   * @throws 如果换取失败则抛出错误
   * 
   * 验证需求: 9.3
   */
  private async getAccessToken(code: string): Promise<{ access_token: string; openid: string; refresh_token: string }> {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
      const params = {
        appid: this.appId,
        secret: this.appSecret,
        code,
        grant_type: 'authorization_code',
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      // 检查微信API返回的错误
      if (data.errcode) {
        throw new Error(`WeChat API error: ${data.errcode} - ${data.errmsg}`);
      }

      // 验证必需字段
      if (!data.access_token || !data.openid) {
        throw new Error('Invalid response from WeChat API: missing access_token or openid');
      }

      return {
        access_token: data.access_token,
        openid: data.openid,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('WeChat API error')) {
        throw error;
      }
      if (error instanceof Error && error.message.startsWith('Invalid response')) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get access token: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 使用access_token获取用户信息
   * 
   * @param accessToken - 访问令牌
   * @param openid - 用户的openid
   * @returns 微信用户信息
   * @throws 如果获取失败则抛出错误
   * 
   * 验证需求: 9.4, 9.5
   */
  private async getUserInfo(accessToken: string, openid: string): Promise<WeChatUserInfo> {
    try {
      const url = 'https://api.weixin.qq.com/sns/userinfo';
      const params = {
        access_token: accessToken,
        openid,
        lang: 'zh_CN',
      };

      // 解决微信API返回中文昵称时的编码问题
      // 参考: https://blog.csdn.net/weixin_47792780/article/details/136894444
      // 微信接口返回的数据可能被axios错误地以ISO-8859-1解码，导致中文乱码
      // 解决方案：使用 responseType: 'arraybuffer' 获取原始字节，然后手动UTF-8解码
      const response = await axios.get(url, {
        params,
        responseType: 'arraybuffer',
        // 强制不转换响应数据，保持原始字节
        transformResponse: [(data) => data],
      });

      let dataStr: string;
      const rawData = response.data;

      if (typeof rawData === 'string') {
        // 如果axios返回了字符串（responseType:arraybuffer未生效），
        // 说明原始UTF-8字节被作为ISO-8859-1/latin1字符处理了。
        // 例如 "蜃" (UTF-8: 0xE8 0x9C 0x83) 显示为 'è\x9C\x83'
        // 需要用latin1编码还原回Buffer，再用utf-8解码
        dataStr = Buffer.from(rawData, 'latin1').toString('utf-8');
      } else if (Buffer.isBuffer(rawData)) {
        // Node.js Buffer，直接解码
        dataStr = rawData.toString('utf-8');
      } else if (rawData instanceof ArrayBuffer) {
        // ArrayBuffer，转换为Buffer后解码
        dataStr = Buffer.from(rawData).toString('utf-8');
      } else {
        // 其他情况，尝试通过Buffer处理
        dataStr = Buffer.from(rawData).toString('utf-8');
      }

      // 打印原始数据用于调试（仅在开发环境）
      if (process.env.NODE_ENV !== 'production') {
        console.log('WeChat userinfo raw response type:', typeof rawData, Buffer.isBuffer(rawData));
      }

      const data = JSON.parse(dataStr);

      // 打印解析后的昵称用于验证编码是否正确
      console.log('WeChat userinfo parsed nickname:', data.nickname);

      // 检查微信API返回的错误
      if (data.errcode) {
        throw new Error(`WeChat API error: ${data.errcode} - ${data.errmsg}`);
      }

      // 验证必需字段
      if (!data.openid || !data.nickname || !data.headimgurl) {
        throw new Error('Invalid response from WeChat API: missing required user info fields');
      }

      return {
        openid: data.openid,
        nickname: data.nickname,
        headimgurl: data.headimgurl,
        unionid: data.unionid,
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('WeChat API error')) {
        throw error;
      }
      if (error instanceof Error && error.message.startsWith('Invalid response')) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get user info: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 处理授权回调，完成整个授权流程
   * 
   * @param code - 微信返回的授权码
   * @returns 微信用户信息
   * @throws 如果授权流程失败则抛出错误
   * 
   * 验证需求: 9.2, 9.3, 9.4, 9.5, 9.6
   */
  async handleCallback(code: string): Promise<WeChatUserInfo> {
    try {
      // 步骤1: 使用授权码换取access_token
      const { access_token, openid } = await this.getAccessToken(code);

      // 步骤2: 使用access_token获取用户信息
      const userInfo = await this.getUserInfo(access_token, openid);

      return userInfo;
    } catch (error) {
      // 返回明确的错误信息（需求9.6）
      if (error instanceof Error) {
        throw new Error(`WeChat authorization failed: ${error.message}`);
      }
      throw new Error('WeChat authorization failed: Unknown error');
    }
  }

  /**
   * 刷新access_token
   * 
   * @param refreshToken - 刷新令牌
   * @returns 新的access_token
   * @throws 如果刷新失败则抛出错误
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token';
      const params = {
        appid: this.appId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      const response = await axios.get(url, { params });
      const data = response.data;

      // 检查微信API返回的错误
      if (data.errcode) {
        throw new Error(`WeChat API error: ${data.errcode} - ${data.errmsg}`);
      }

      // 验证必需字段
      if (!data.access_token) {
        throw new Error('Invalid response from WeChat API: missing access_token');
      }

      return data.access_token;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('WeChat API error')) {
        throw error;
      }
      if (error instanceof Error && error.message.startsWith('Invalid response')) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to refresh access token: ${error.message}`);
      }
      throw error;
    }
  }
}
