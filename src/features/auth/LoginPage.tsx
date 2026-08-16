import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdministrator, persistAdministratorSession } from "./api";
import "../../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();
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
      navigate("/creators", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "관리자 로그인에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="partners-login" data-visual-contract="login">
      <section
        aria-labelledby="hi-selectors-login-title"
        className="partners-login__card"
        data-login-part="card"
      >
        <header className="partners-login__brand">
          <img
            alt=""
            className="partners-login__brand-mark"
            src={`${import.meta.env.BASE_URL}favicon.png`}
          />
          <div>
            <span className="partners-login__eyebrow">ADMIN</span>
            <h1 id="hi-selectors-login-title">Hi-Selectors</h1>
          </div>
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
          {errorMessage ? (
            <p className="partners-login__error" role="alert">{errorMessage}</p>
          ) : null}
          <button className="partners-login__submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}
