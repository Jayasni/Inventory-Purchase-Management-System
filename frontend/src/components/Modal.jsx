
export default function Modal({
  title,
  onClose,
  children,
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
