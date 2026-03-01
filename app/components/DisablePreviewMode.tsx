import { Link } from "react-router";

export function DisablePreviewMode() {
  return (
    <Link
      to="/api/preview-mode/disable"
      reloadDocument
      className="fixed bottom-4 right-4 bg-white text-gray-900 px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors z-50"
    >
      Sair do modo de edição
    </Link>
  );
}
