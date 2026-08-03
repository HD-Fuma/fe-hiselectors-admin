interface EditorFrameProps {
  label: string;
  text: string;
}

const TOOLBAR_ROWS = [
  ["문서", "실행취소", "다시실행", "복사", "붙여넣기", "링크", "표", "이미지"],
  ["기본 서식", "맑은 고딕", "12pt", "굵게", "기울임", "밑줄", "왼쪽", "가운데"],
];

export function EditorFrame({ label, text }: EditorFrameProps) {
  return (
    <section aria-label={`${label} 본문`} className="fuma-editor-frame">
      <div aria-hidden="true" className="fuma-editor-frame__toolbar">
        {TOOLBAR_ROWS.map((row, rowIndex) => (
          <div className="fuma-editor-frame__toolbar-row" key={rowIndex}>
            {row.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ))}
      </div>
      <pre className="fuma-editor-frame__source">
        <code>{`<p>${text}</p>`}</code>
      </pre>
    </section>
  );
}
