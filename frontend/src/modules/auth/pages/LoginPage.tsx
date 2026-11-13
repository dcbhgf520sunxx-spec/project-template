import { type FormEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Card, Input, Typography } from 'antd';
import {
  ApartmentOutlined,
  FieldTimeOutlined,
  InteractionOutlined,
  LockOutlined,
  NodeIndexOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { derivePermissions, getLoginCaptcha, getUserPreference, login, type LoginCaptcha } from '../../../api/authApi';
import { ApiError } from '../../../api/apiError';
import { logoutAccessSession } from '../../../api/accessLogApi';
import { AdminInput } from '../../../components/admin';
import { PasswordChangeModal } from '../../account/components/PasswordChangeModal';
import { useAuthStore } from '../../../stores/authStore';
import robotMini from '../../../assets/login/robot-mini.png';
import './LoginPage.css';

type FocusedField = 'account' | 'password' | 'captcha' | null;

type Ripple = {
  id: number;
  x: number;
  y: number;
  size: number;
};

export function LoginPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const accessSessionId = useAuthStore((state) => state.accessSessionId);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setPreference = useAuthStore((state) => state.setPreference);
  const mustChangePassword = useAuthStore((state) => state.mustChangePassword);
  const setMustChangePassword = useAuthStore((state) => state.setMustChangePassword);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [captcha, setCaptcha] = useState<LoginCaptcha | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const captchaRequest = useRef(0);

  const refreshCaptcha = useCallback(async () => {
    const requestId = ++captchaRequest.current;
    setCaptcha(null);
    setCaptchaCode('');
    setCaptchaLoading(true);
    try {
      const result = await getLoginCaptcha();
      if (requestId === captchaRequest.current) setCaptcha(result);
    } catch (error) {
      if (requestId === captchaRequest.current) {
        setCaptchaError(error instanceof Error ? error.message : '验证码获取失败，请重试');
      }
    } finally {
      if (requestId === captchaRequest.current) setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    const sequence = captchaRequest;
    void refreshCaptcha();
    return () => { sequence.current++; };
  }, [refreshCaptcha]);

  const exitFirstLogin = () => {
    const token = useAuthStore.getState().token;
    void logoutAccessSession(accessSessionId, { token }).catch(() => {
      message.warning('退出请求未完成，已清除本地登录状态');
    });
    clearAuth();
    setPassword('');
    setCaptchaError('');
    void refreshCaptcha();
    navigate('/login', { replace: true });
  };

  const enterPreferredPage = async () => {
    const preference = await getUserPreference();
    setPreference(preference);
    message.success('登录成功');
    navigate(preference.default_route || '/home', { replace: true });
  };

  const createRipple = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.7;
    const id = Date.now();
    setRipples((items) => [
      ...items,
      {
        id,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
        size
      }
    ]);
    window.setTimeout(() => {
      setRipples((items) => items.filter((item) => item.id !== id));
    }, 760);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setButtonPressed(true);
    window.setTimeout(() => setButtonPressed(false), 180);

    if (!account.trim()) {
      message.error('工号或手机号不能为空');
      return;
    }
    if (!password) {
      message.error('密码不能为空');
      return;
    }

    if (!captcha || !captchaCode.trim()) {
      setCaptchaError('请输入图形验证码');
      return;
    }

    setCaptchaError('');
    setSubmitting(true);
    try {
      const result = await login({
        account: account.trim(),
        password,
        captcha_id: captcha.captcha_id,
        captcha_code: captchaCode.trim()
      });
      const firstLogin = result.first_login === 1;
      setAuth({
        token: result.token,
        user: result.user,
        menus: result.menus,
        permissions: derivePermissions(result.menus),
        accessSessionId: result.access_session_id,
        mustChangePassword: firstLogin
      });
      if (firstLogin) {
        message.warning('首次登录，请先修改密码');
        return;
      }
      await enterPreferredPage();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors?.captcha_code) {
        setCaptchaError(error.fieldErrors.captcha_code.join('；'));
      } else {
        message.error(error instanceof Error ? error.message : '登录失败');
      }
      void refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="login-page">
      <div className="login-intro" aria-hidden="true">
        <div className="login-hero-headline">
          <div className="login-hero-robot">
            <img src={robotMini} alt="" />
          </div>
          <Typography.Title className="login-hero-title" level={1}>
            让 AI 参与业务运行的每一个关键环节
          </Typography.Title>
        </div>
        <p className="login-hero-copy">
          小安智能管理平台连接业务数据、智能体能力与人工决策，将 AI 的执行过程、交互记录与处理结果统一沉淀，让业务从单点操作走向可协同、可追踪、可持续优化。
        </p>
        <div className="login-signal-grid">
          <span>
            <InteractionOutlined />
            智能协同
          </span>
          <span>
            <NodeIndexOutlined />
            过程透明
          </span>
          <span>
            <ApartmentOutlined />
            结果沉淀
          </span>
        </div>
      </div>
      <Card className="login-card" onMouseDown={createRipple}>
        <div className="login-ripple-layer" aria-hidden="true">
          {ripples.map((ripple) => (
            <span
              className="login-ripple"
              key={ripple.id}
              style={{
                height: ripple.size,
                left: ripple.x,
                top: ripple.y,
                width: ripple.size
              }}
            />
          ))}
        </div>
        <div className="login-card-header">
          <span className="login-card-badge">
            <SafetyCertificateOutlined />
            安全登录
          </span>
        </div>
        <Typography.Title className="login-title" level={3}>
          小安智能管理平台
        </Typography.Title>
        <form autoComplete="on" className="login-form" onSubmit={handleSubmit}>
          <label
            className={`login-field ${focusedField === 'account' ? 'is-focused' : ''}`}
            htmlFor="login-username"
          >
            <Input
              autoComplete="username"
              id="login-username"
              name="username"
              onBlur={() => setFocusedField(null)}
              onChange={(event) => setAccount(event.target.value)}
              onFocus={() => setFocusedField('account')}
              placeholder="请输入账号或手机号"
              prefix={<UserOutlined />}
              value={account}
            />
          </label>
          <label
            className={`login-field ${focusedField === 'password' ? 'is-focused' : ''}`}
            htmlFor="login-password"
          >
            <Input.Password
              autoComplete="current-password"
              id="login-password"
              name="password"
              onBlur={() => setFocusedField(null)}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setFocusedField('password')}
              placeholder="请输入密码"
              prefix={<LockOutlined />}
              value={password}
            />
          </label>
          <div>
            <div className="login-captcha-row">
              <label
                className={`login-field ${focusedField === 'captcha' ? 'is-focused' : ''}`}
                htmlFor="login-captcha"
              >
                <AdminInput
                  id="login-captcha"
                  aria-label="图形验证码"
                  aria-invalid={Boolean(captchaError)}
                  aria-describedby={`login-captcha-hint${captchaError ? ' login-captcha-error' : ''}`}
                  autoComplete="off"
                  maxLength={5}
                  onBlur={() => setFocusedField(null)}
                  onChange={(event) => { setCaptchaCode(event.target.value); setCaptchaError(''); }}
                  onFocus={() => setFocusedField('captcha')}
                  placeholder="请输入验证码"
                  prefix={<SafetyCertificateOutlined />}
                  value={captchaCode}
                />
              </label>
              <Button
                className="login-captcha-refresh"
                aria-label="刷新验证码"
                title="看不清？点击刷新验证码"
                disabled={submitting}
                loading={captchaLoading}
                onClick={() => { setCaptchaError(''); void refreshCaptcha(); }}
              >
                {captcha ? <img src={captcha.image} alt="图形验证码" width={150} height={44} /> : '获取验证码'}
              </Button>
            </div>
            <p className="login-captcha-hint" id="login-captcha-hint">不区分大小写，点击图片可换一张</p>
            {captchaError && <div className="login-field-error" id="login-captcha-error" role="alert">{captchaError}</div>}
          </div>
          <Button
            className={`login-submit ${buttonPressed ? 'is-pressed' : ''}`}
            htmlType="submit"
            loading={submitting}
            type="primary"
          >
            进入平台
          </Button>
        </form>
        <div className="login-trust-row" aria-hidden="true">
          <span>
            <ThunderboltOutlined />
            智能体协同
          </span>
          <span>
            <FieldTimeOutlined />
            结果可追溯
          </span>
        </div>
      </Card>
      </section>
      <PasswordChangeModal
        open={mustChangePassword}
        forced
        onCancel={exitFirstLogin}
        onSuccess={() => {
          setMustChangePassword(false);
          void enterPreferredPage();
        }}
      />
    </>
  );
}
