/** Normaliza un param de ruta de Express 5 (`string | string[]`) a `string`. */
export function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
