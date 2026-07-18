import { parseDirectoryFilters, buildDirectoryParams, directoryHref } from "../src/lib/directory/filters";

let failed = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  if (!cond) failed++;
}

// Parseo de searchParams válidos.
const ok = parseDirectoryFilters({ categoria: "cafe", zona: "Temozon-Norte", perfil: "me-mudo" });
check("categoria válida", ok.categoria === "cafe");
check("zona normalizada a minúscula", ok.zona === "temozon-norte");
check("perfil válido", ok.perfil === "me-mudo");

// Descarta valores no válidos.
const bad = parseDirectoryFilters({ categoria: "dragones", perfil: "millonario" });
check("categoria inválida -> null", bad.categoria === null);
check("perfil inválido -> null", bad.perfil === null);

// Acepta URLSearchParams además del objeto.
const fromUsp = parseDirectoryFilters(new URLSearchParams("categoria=bar"));
check("lee URLSearchParams", fromUsp.categoria === "bar");

// Build omite lo nulo.
const params = buildDirectoryParams({ categoria: "cafe", zona: null, perfil: "retiro" });
check("build omite nulos", params.toString() === "categoria=cafe&perfil=retiro");

// Href limpio cuando no hay filtros.
check("href sin filtros es la ruta base", directoryHref({ categoria: null, zona: null, perfil: null }, {}) === "/vivir-en-merida/directorio");
check(
  "href con patch cambia el filtro",
  directoryHref({ categoria: "cafe", zona: null, perfil: null }, { categoria: "bar" }) ===
    "/vivir-en-merida/directorio?categoria=bar"
);

if (failed > 0) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log("\nTodos los tests de filtros pasaron.");
