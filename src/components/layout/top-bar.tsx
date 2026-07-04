export function TopBar({ title = "Aurum Agent" }: { title?: string }) {
  return (
    <header className="top-bar">
      <div className="top-bar-title-group">
        <strong className="headline" style={{ fontSize: 20 }}>
          {title}
        </strong>
      </div>
    </header>
  );
}
