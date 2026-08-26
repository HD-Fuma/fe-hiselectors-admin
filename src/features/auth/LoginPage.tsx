import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  getAdministratorSession,
  loginAdministrator,
  persistAdministratorSession,
} from "./api";
import "../../styles/login.css";

export interface LoginLocationState {
  from?: string;
}

function safeReturnPath(state: LoginLocationState | null) {
  const from = state?.from;
  return typeof from === "string" && from.startsWith("/") && !from.startsWith("//")
    ? from
    : "/creators";
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submitLogin = async () => {
    const normalizedLoginId = loginId.trim();
    if (!normalizedLoginId || !password.trim()) {
      setErrorMessage("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await loginAdministrator({
        loginId: normalizedLoginId,
        password,
      });
      persistAdministratorSession(session);
      navigate(safeReturnPath(location.state as LoginLocationState | null), {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "관리자 로그인에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (getAdministratorSession()) {
    return (
      <Navigate
        replace
        to={safeReturnPath(location.state as LoginLocationState | null)}
      />
    );
  }

  return (
    <main className="partners-login" data-visual-contract="login">
      <div className="partners-login__stage">
        <section className="partners-login__intro" aria-label="셀렉터스 관리자 소개">
          <img
            alt="the HYUNDAI hihi"
            className="partners-login__wordmark"
            src={`${import.meta.env.BASE_URL}brand/thehyundai-hi.svg`}
          />
          <div className="partners-login__intro-copy">
            <span className="partners-login__eyebrow">HI-SELECTORS ADMIN</span>
            <h2>셀렉터스 운영을<br />한곳에서</h2>
            <p>크리에이터 발굴부터 제안과 성과 관리까지<br />효율적으로 운영하세요.</p>
          </div>
        </section>

        <section
          aria-labelledby="hi-selectors-login-title"
          className="partners-login__card"
          data-login-part="card"
        >
          <header className="partners-login__brand">
            <span className="partners-login__eyebrow">HI-SELECTORS ADMIN</span>
            <h1 id="hi-selectors-login-title">관리자 로그인</h1>
            <p>관리자 계정으로 로그인해 주세요.</p>
          </header>

          <form
            aria-label="관리자 로그인"
            aria-busy={isSubmitting}
            className="partners-login__form"
            onSubmit={(event) => {
              event.preventDefault();
              void submitLogin();
            }}
          >
            <label className="partners-login__field">
              <span>아이디</span>
              <input
                autoComplete="username"
                autoFocus
                className="partners-login__field-input"
                disabled={isSubmitting}
                name="loginId"
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="아이디 입력"
                type="text"
                value={loginId}
              />
            </label>
            <label className="partners-login__field">
              <span>비밀번호</span>
              <input
                autoComplete="current-password"
                className="partners-login__field-input"
                disabled={isSubmitting}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                type="password"
                value={password}
              />
            </label>
            <button className="partners-login__submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
            {errorMessage ? (
              <p className="partners-login__error" role="alert">{errorMessage}</p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
