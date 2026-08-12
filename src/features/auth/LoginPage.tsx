import { useLocation, useNavigate } from "react-router-dom";
import { findRequirementCoverage } from "../../app/requirementRows";
import "../../styles/login.css";

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const requirement = findRequirementCoverage(location.pathname, location.search);

  return (
    <main
      className="partners-login"
      data-requirement-rows={requirement?.rows.join(",")}
      data-visual-contract="login"
    >
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
          className="partners-login__form"
          onSubmit={(event) => {
            event.preventDefault();
            navigate("/creators", { replace: true });
          }}
        >
          <label className="partners-login__field">
            <span>아이디</span>
            <input
              autoComplete="username"
              autoFocus
              className="partners-login__field-input"
              name="loginId"
              placeholder="아이디 입력"
              type="text"
            />
          </label>
          <label className="partners-login__field">
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              className="partners-login__field-input"
              name="password"
              placeholder="비밀번호 입력"
              type="password"
            />
          </label>
          <button className="partners-login__submit" type="submit">
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
