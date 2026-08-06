interface EditorFrameProps {
  label: string;
  text: string;
}

export function EditorFrame({ label, text }: EditorFrameProps) {
  return (
    <section aria-label={`${label} 본문`} className="fuma-editor-frame">
      <p className="fuma-editor-frame__text">{text}</p>
    </section>
  );
}
