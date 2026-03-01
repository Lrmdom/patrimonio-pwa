import { redirect } from "react-router";

export async function loader() {
  // Redireciona para o endpoint de enable com um secret padrão para testes
  const secret = "test-secret-visual-editing";
  const targetUrl = `http://localhost:5173/api/preview-mode/enable?secret=${secret}&redirect=/heritage-simple`;
  
  return redirect(targetUrl);
}
