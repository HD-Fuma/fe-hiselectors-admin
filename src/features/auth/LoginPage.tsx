import { ChevronRight, CircleAlert, LockKeyhole, UserRound } from "lucide-react";
import { useLocation } from "react-router-dom";
import { findRequirementCoverage } from "../../app/requirementCoverage";
import { QrBadge } from "./QrBadge";
import "../../styles/login.css";

export function LoginPage() {
  const location = useLocation();
  const requirement = findRequirementCoverage(location.pathname, location.search);

  return (
    <main
      className="partners-login"
      data-requirement-rows={requirement?.rows.join(",")}
    >
      <div className="partners-login__layout">
        <section
          className="partners-login__card"
          data-login-part="card"
          aria-labelledby="partners-login-title"
        >
          <header className="partners-login__brand">
            <h1 id="partners-login-title" className="partners-login__brand-title">
              <span className="partners-login__brand-name">더현대Hi</span>
              <span className="partners-login__brand-divider" aria-hidden="true">
                |
              </span>
              <span className="partners-login__brand-partners">Partners</span>
            </h1>
            <p className="partners-login__subtitle">더현대Hi 협력사 업무지원시스템</p>
          </header>

          <form
            className="partners-login__form"
            aria-label="협력사 로그인"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="partners-login__field">
              <span className="hsas-visually-hidden">아이디</span>
              <UserRound className="partners-login__field-icon" aria-hidden="true" />
              <input
                className="partners-login__field-input"
                type="text"
                name="loginId"
                placeholder="ID를 입력하세요."
                autoComplete="username"
              />
            </label>
            <label className="partners-login__field">
              <span className="hsas-visually-hidden">비밀번호</span>
              <LockKeyhole className="partners-login__field-icon" aria-hidden="true" />
              <input
                className="partners-login__field-input"
                type="password"
                name="password"
                placeholder="비밀번호를 입력하세요."
                autoComplete="current-password"
              />
            </label>

            <label className="partners-login__remember">
              <input type="checkbox" name="rememberId" />
              <span>아이디 저장</span>
            </label>

            <button className="partners-login__submit" type="submit">
              로그인
            </button>
          </form>

          <nav className="partners-login__account-links" aria-label="계정 지원">
            <a href="/login#find-id">아이디 찾기</a>
            <span className="partners-login__account-divider" aria-hidden="true" />
            <a href="/login#reset-password">비밀번호 초기화</a>
          </nav>

          <a className="partners-login__manager-link" href="/login#manager">
            <CircleAlert aria-hidden="true" />
            <span>시스템 담당자 문의</span>
            <ChevronRight aria-hidden="true" />
          </a>
        </section>

        <aside
          className="partners-login__quick-links"
          data-login-part="quick-links"
          aria-label="협력사 바로가기"
        >
          <nav className="partners-login__quick-navigation" aria-label="협력사 안내">
            <a href="/login#new-store">
              <span>신규입점문의</span>
              <ChevronRight aria-hidden="true" />
            </a>
            <a href="/login#advertising">
              <span>광고신청/안내</span>
              <ChevronRight aria-hidden="true" />
            </a>
          </nav>
          <div className="partners-login__qr" data-login-part="qr">
            <QrBadge />
            <p>파트너스 APP 다운로드</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
