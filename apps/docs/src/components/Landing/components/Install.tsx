const installCommand = "npm install -D recontent";

export function Install() {
  return (
    <div className="lp-install">
      <span aria-hidden="true">$</span>
      <code>{installCommand}</code>
    </div>
  );
}
