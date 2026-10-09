// Decide se um item de menu corresponde à tela atual.
// - Por padrão vale a própria rota e qualquer rota filha ("/dashboard/status/x" ativa "/dashboard/status").
// - `exact` limita à própria rota (para "/dashboard", que é pai de todas as outras).
// - `alsoActiveFor` lista prefixos extras que também ativam o item (por exemplo, a ficha de um
//   aluno ativa "Meus Alunos").
export function isNavActive(
  pathname: string,
  href: string,
  options: { exact?: boolean; alsoActiveFor?: string[] } = {}
): boolean {
  const { exact = false, alsoActiveFor = [] } = options;
  const own = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return own || alsoActiveFor.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
